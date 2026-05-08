import { generateId } from '../shared/generateId.js'
import { EventStore } from './EventStore.js'
import { MioumCommandHandler } from './mioum/MioumCommandHandler.js'
import { MioumProjection } from './mioum/MioumProjection.js'

export class CommandDispatcher {
  #store
  #handlers
  #projections

  constructor(eventStore) {
    this.#store = eventStore ?? new EventStore()
    const mioumProjection = new MioumProjection(this.#store)
    this.#projections = { mioum: mioumProjection }
    this.#handlers = { mioum: new MioumCommandHandler(mioumProjection) }
  }

  async handle(ws, { id, module, action, payload }, clients) {
    const handler = this.#handlers[module]
    if (!handler) {
      ws.send(JSON.stringify({ id, ok: false, error: `Unknown module: ${module}` }))
      return
    }
    try {
      const domainEvent = handler.execute(action, payload)
      this.#store.append({ ...domainEvent, id: generateId() })
      ws.send(JSON.stringify({ id, ok: true }))
      const state = this.#projections[module].rebuild()
      const msg = JSON.stringify({ type: 'state', module, data: state })
      for (const client of clients) client.send(msg)
    } catch (err) {
      ws.send(JSON.stringify({ id, ok: false, error: err.message }))
    }
  }

  snapshots() {
    return Object.entries(this.#projections).map(([module, projection]) => ({
      module,
      data: projection.rebuild(),
    }))
  }
}
