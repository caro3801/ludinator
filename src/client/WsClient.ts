import { generateId } from '../shared/generateId'
import { EventId } from '../shared/types'

const QUEUE_KEY = 'ludinator:queue'

interface QueueCommand {
  id: EventId
  module: string
  action: string
  payload: unknown
  timestamp: number
  retries: number
}

interface StateMessage {
  type: 'state'
  module: string
  data: unknown
}

interface AckMessage {
  id: EventId
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
 * Commands are persisted to localStorage and retried on reconnection
 */
export class WsClient {
  readonly #url: string
  #ws: WebSocket | null = null
  #connected: boolean = false
  #pendingAcks: Map<EventId, { resolve: () => void; reject: (err: Error) => void }> = new Map()
  #pendingResponses: Map<EventId, { resolve: (data: unknown) => void; reject: (err: Error) => void }> = new Map()
  #stateHandlers: Record<string, ((data: unknown) => void)[]> = {}
  #connectionHandlers: ((info: ConnectionInfo) => void)[] = []
  #retryDelay: number = 1000
  #connectionPromise: Promise<void> | null = null
  #connectionResolve: (() => void) | null = null
  #sending: Set<EventId> = new Set()

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
      this.#retryDelay = 1000
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
      if ('type' in msg && msg.type === 'state') {
        const handlers = this.#stateHandlers[msg.module] ?? []
        for (const h of handlers) h(msg.data)
        return
      }
      if ('id' in msg) {
        const ackMsg = msg as AckMessage
        this.#sending.delete(ackMsg.id)
        this.#removeFromQueue(ackMsg.id)
        this.#notifyConnection()
        
        // Gérer les ACK standard (ok/error)
        const ackCallbacks = this.#pendingAcks.get(ackMsg.id)
        if (ackCallbacks) {
          this.#pendingAcks.delete(ackMsg.id)
          ackMsg.ok ? ackCallbacks.resolve() : ackCallbacks.reject(new Error(ackMsg.error ?? 'Unknown error'))
          return
        }

        if (ackMsg.ok !== undefined) {
          const responseCallbacks = this.#pendingResponses.get(ackMsg.id)
          if (responseCallbacks) {
            this.#pendingResponses.delete(ackMsg.id)
            if (ackMsg.ok) {
              const { id, ok, ...responseData } = ackMsg as unknown as Record<string, unknown>
              responseCallbacks.resolve(responseData)
            } else {
              responseCallbacks.reject(new Error(ackMsg.error ?? 'Unknown error'))
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

  #removeFromQueue(id: EventId): void {
    const queue = loadQueue()
    const updated = queue.filter(c => c.id !== id)
    saveQueue(updated)
  }

  #incrementRetry(id: EventId): void {
    const queue = loadQueue()
    const updated = queue.map(c => c.id === id ? { ...c, retries: c.retries + 1 } : c)
    saveQueue(updated)
  }

  async #sendNow(cmd: QueueCommand): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.#pendingResponses.set(cmd.id, { resolve, reject })
      this.#sending.add(cmd.id)
      if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
        this.#ws.send(JSON.stringify(cmd))
      } else {
        reject(new Error('WebSocket not connected'))
      }
    })
  }

  async #flushQueue(): Promise<void> {
    const queue = loadQueue()
    if (queue.length === 0) return

    for (const cmd of queue) {
      if (this.#sending.has(cmd.id)) continue
        
      try {
        this.#sending.add(cmd.id)
        await this.#sendNow(cmd)
      } catch {
        this.#sending.delete(cmd.id)
        this.#incrementRetry(cmd.id)
        this.#notifyConnection()
      }
    }
  }

  async send(module: string, action: string, payload: unknown = {}): Promise<unknown> {
    const cmd: QueueCommand = { 
      id: generateId(), 
      module, 
      action, 
      payload,
      timestamp: Date.now(),
      retries: 0
    }
    
    // Always queue the command for persistence
    const queue = loadQueue()
    queue.push(cmd)
    saveQueue(queue)
    this.#notifyConnection()
    
    // If connected, send immediately
    if (this.#connected) {
      try {
        return await this.#sendNow(cmd)
      } catch {
        // Will be retried in flushQueue
        return new Promise((resolve, reject) => {
          this.#pendingResponses.set(cmd.id, { resolve, reject })
        })
      }
    }
    
    // If not connected, wait for connection and then flush
    await this.#connectionPromise
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
