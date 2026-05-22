import { generateId } from '../shared/generateId'

const QUEUE_KEY = 'ludinator:queue'

interface QueueCommand {
  id: string
  module: string
  action: string
  payload: unknown
}

interface StateMessage {
  type: 'state'
  module: string
  data: unknown
}

interface AckMessage {
  id: string
  ok: boolean
  error?: string
}

type IncomingMessage = StateMessage | AckMessage

interface ConnectionInfo {
  connected: boolean
  queueLength: number
}

function loadQueue(): QueueCommand[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] }
}

function saveQueue(queue: QueueCommand[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

/**
 * WebSocket client with offline queue support
 * Automatically reconnects and queues commands when offline
 */
export class WsClient {
  readonly #url: string
  #ws: WebSocket | null = null
  #connected: boolean = false
  #pendingAcks: Map<string, { resolve: () => void; reject: (err: Error) => void }> = new Map()
  #stateHandlers: Record<string, ((data: unknown) => void)[]> = {}
  #connectionHandlers: ((info: ConnectionInfo) => void)[] = []
  #retryDelay: number = 1000

  constructor(url: string) {
    this.#url = url
    this.#connect()
  }

  #connect(): void {
    this.#ws = new WebSocket(this.#url)

    this.#ws.onopen = () => {
      this.#connected = true
      this.#notifyConnection()
      this.#flushQueue()
    }

    this.#ws.onclose = () => {
      this.#connected = false
      this.#notifyConnection()
      this.#scheduleReconnect()
    }

    this.#ws.onerror = () => {
      if (this.#ws) {
        this.#ws.close()
      }
    }

    this.#ws.onmessage = ({ data }: MessageEvent<string>) => {
      const msg: IncomingMessage = JSON.parse(data)
      if (msg.type === 'state') {
        const handlers = this.#stateHandlers[msg.module] ?? []
        for (const h of handlers) h(msg.data)
        return
      }
      if ('id' in msg) {
        const ackMsg = msg as AckMessage
        const callbacks = this.#pendingAcks.get(ackMsg.id)
        this.#pendingAcks.delete(ackMsg.id)
        if (!callbacks) return
        ackMsg.ok ? callbacks.resolve() : callbacks.reject(new Error(ackMsg.error))
      }
    }
  }

  #scheduleReconnect(): void {
    setTimeout(() => {
      this.#retryDelay = Math.min(this.#retryDelay * 2, 30000)
      this.#connect()
    }, this.#retryDelay)
  }

  #notifyConnection(): void {
    const queue = loadQueue()
    for (const h of this.#connectionHandlers) {
      h({ connected: this.#connected, queueLength: queue.length })
    }
  }

  async #flushQueue(): Promise<void> {
    this.#retryDelay = 1000
    const queue = loadQueue()
    for (const cmd of queue) {
      try {
        await this.#sendNow(cmd)
        const remaining = loadQueue().filter(c => c.id !== cmd.id)
        saveQueue(remaining)
        this.#notifyConnection()
      } catch {
        const remaining = loadQueue().filter(c => c.id !== cmd.id)
        saveQueue(remaining)
        this.#notifyConnection()
      }
    }
  }

  #sendNow(cmd: QueueCommand): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#pendingAcks.set(cmd.id, { resolve, reject })
      if (this.#ws) {
        this.#ws.send(JSON.stringify(cmd))
      }
    })
  }

  send(module: string, action: string, payload: unknown = {}): Promise<void> {
    const cmd: QueueCommand = { id: generateId(), module, action, payload }
    if (this.#connected) {
      return this.#sendNow(cmd)
    }
    const queue = loadQueue()
    queue.push(cmd)
    saveQueue(queue)
    this.#notifyConnection()
    return Promise.resolve()
  }

  onState(module: string, callback: (data: unknown) => void): void {
    if (!this.#stateHandlers[module]) {
      this.#stateHandlers[module] = []
    }
    this.#stateHandlers[module].push(callback)
  }

  onConnectionChange(callback: (info: ConnectionInfo) => void): void {
    this.#connectionHandlers.push(callback)
  }
}
