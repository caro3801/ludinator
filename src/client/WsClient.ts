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
  #pendingResponses: Map<string, { resolve: (data: unknown) => void; reject: (err: Error) => void }> = new Map()
  #stateHandlers: Record<string, ((data: unknown) => void)[]> = {}
  #connectionHandlers: ((info: ConnectionInfo) => void)[] = []
  #retryDelay: number = 1000
  #connectionPromise: Promise<void> | null = null
  #connectionResolve: (() => void) | null = null

  constructor(url: string) {
    this.#url = url
    this.#connectionPromise = new Promise((resolve) => {
      this.#connectionResolve = resolve
    })
    this.#connect()
  }

  #connect(): void {
    this.#ws = new WebSocket(this.#url)

    this.#ws.onopen = () => {
      this.#connected = true
      this.#notifyConnection()
      this.#connectionResolve?.()
      this.#connectionResolve = null
      this.#flushQueue()
    }

    this.#ws.onclose = () => {
      this.#connected = false
      this.#notifyConnection()
      this.#connectionPromise = new Promise((resolve) => {
        this.#connectionResolve = resolve
      })
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
        
        // Gérer les ACK standard (ok/error)
        const ackCallbacks = this.#pendingAcks.get(ackMsg.id)
        if (ackCallbacks) {
          this.#pendingAcks.delete(ackMsg.id)
          ackMsg.ok ? ackCallbacks.resolve() : ackCallbacks.reject(new Error(ackMsg.error))
          return
        }
        
        // Gérer les réponses avec données supplémentaires (comme admin commands)
        // Si le message a un id mais aussi d'autres propriétés (status, etc.)
        if (ackMsg.ok !== undefined) {
          const responseCallbacks = this.#pendingResponses.get(ackMsg.id)
          if (responseCallbacks) {
            this.#pendingResponses.delete(ackMsg.id)
            if (ackMsg.ok) {
              // Retourner le message complet (sans id et ok)
              const { id, ok, ...responseData } = ackMsg as any
              responseCallbacks.resolve(responseData)
            } else {
              responseCallbacks.reject(new Error(ackMsg.error))
            }
          }
        }
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

  #sendNow(cmd: QueueCommand): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.#pendingResponses.set(cmd.id, { resolve, reject })
      if (this.#ws) {
        this.#ws.send(JSON.stringify(cmd))
      }
    })
  }

  async send(module: string, action: string, payload: unknown = {}): Promise<unknown> {
    // Wait for connection if not connected
    if (!this.#connected) {
      await this.#connectionPromise
    }
    const cmd: QueueCommand = { id: generateId(), module, action, payload }
    return this.#sendNow(cmd)
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
