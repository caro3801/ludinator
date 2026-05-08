import { generateId } from '../shared/generateId.js'

const QUEUE_KEY = 'ludinator:queue'

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export class WsClient {
  #url
  #ws = null
  #connected = false
  #pendingAcks = new Map()
  #stateHandlers = {}
  #connectionHandlers = []

  constructor(url) {
    this.#url = url
    this.#connect()
  }

  #connect() {
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
      this.#ws.close()
    }

    this.#ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data)
      if (msg.type === 'state') {
        const handlers = this.#stateHandlers[msg.module] ?? []
        for (const h of handlers) h(msg.data)
        return
      }
      if (msg.id) {
        const { resolve, reject } = this.#pendingAcks.get(msg.id) ?? {}
        this.#pendingAcks.delete(msg.id)
        if (!resolve) return
        msg.ok ? resolve() : reject(new Error(msg.error))
      }
    }
  }

  #retryDelay = 1000

  #scheduleReconnect() {
    setTimeout(() => {
      this.#retryDelay = Math.min(this.#retryDelay * 2, 30000)
      this.#connect()
    }, this.#retryDelay)
  }

  #notifyConnection() {
    const queue = loadQueue()
    for (const h of this.#connectionHandlers) h({ connected: this.#connected, queueLength: queue.length })
  }

  async #flushQueue() {
    this.#retryDelay = 1000
    const queue = loadQueue()
    for (const cmd of queue) {
      try {
        await this.#sendNow(cmd)
        const remaining = loadQueue().filter(c => c.id !== cmd.id)
        saveQueue(remaining)
        this.#notifyConnection()
      } catch (err) {
        const remaining = loadQueue().filter(c => c.id !== cmd.id)
        saveQueue(remaining)
        this.#notifyConnection()
      }
    }
  }

  #sendNow(cmd) {
    return new Promise((resolve, reject) => {
      this.#pendingAcks.set(cmd.id, { resolve, reject })
      this.#ws.send(JSON.stringify(cmd))
    })
  }

  send(module, action, payload = {}) {
    const cmd = { id: generateId(), module, action, payload }
    if (this.#connected) {
      return this.#sendNow(cmd)
    }
    const queue = loadQueue()
    queue.push(cmd)
    saveQueue(queue)
    this.#notifyConnection()
    return Promise.resolve()
  }

  onState(module, callback) {
    this.#stateHandlers[module] ??= []
    this.#stateHandlers[module].push(callback)
  }

  onConnectionChange(callback) {
    this.#connectionHandlers.push(callback)
  }
}
