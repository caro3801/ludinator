import { generateId } from '../shared/generateId'
import { EventStore } from './EventStore'
import { MioumCommandHandler } from './mioum/MioumCommandHandler'
import { MioumProjection } from './mioum/MioumProjection'
import { CrewCommandHandler } from './crew/CrewCommandHandler'
import { CrewProjection } from './crew/CrewProjection'
import { FestCommandHandler } from './fest/FestCommandHandler'
import { FestProjection } from './fest/FestProjection'

// Type for module handlers
interface ModuleHandler {
  execute(action: string, payload: unknown): unknown
}

// Type for module projections
interface ModuleProjection {
  rebuild(): unknown
}

type ModuleName = 'mioum' | 'crew' | 'fest'

/**
 * Dispatches commands to the appropriate handler and broadcasts state updates
 */
export class CommandDispatcher {
  readonly #store: EventStore
  readonly #handlers: Record<ModuleName, ModuleHandler>
  readonly #projections: Record<ModuleName, ModuleProjection>

  constructor(eventStore?: EventStore) {
    this.#store = eventStore ?? new EventStore()
    const mioumProjection = new MioumProjection(this.#store)
    const crewProjection = new CrewProjection(this.#store)
    const festProjection = new FestProjection(this.#store)
    this.#projections = {
      mioum: mioumProjection,
      crew: crewProjection,
      fest: festProjection,
    } as const
    this.#handlers = {
      mioum: new MioumCommandHandler(mioumProjection),
      crew: new CrewCommandHandler(crewProjection),
      fest: new FestCommandHandler(festProjection),
    } as const
  }

  /**
   * Handle an incoming command from a WebSocket client
   */
  async handle(
    ws: WebSocket,
    command: { id: string; module: string; action: string; payload: unknown },
    clients: Set<WebSocket>
  ): Promise<void> {
    const module = command.module as ModuleName
    const handler = this.#handlers[module]
    if (!handler) {
      ws.send(JSON.stringify({ id: command.id, ok: false, error: `Unknown module: ${module}` }))
      return
    }
    try {
      const domainEvent = handler.execute(command.action, command.payload)
      this.#store.append({ ...domainEvent, id: generateId() })
      ws.send(JSON.stringify({ id: command.id, ok: true }))
      const state = this.#projections[module].rebuild()
      const msg = JSON.stringify({ type: 'state', module, data: state })
      for (const client of clients) {
        client.send(msg)
      }
    } catch (err) {
      const error = err as Error
      ws.send(JSON.stringify({ id: command.id, ok: false, error: error.message }))
    }
  }

  /**
   * Get snapshots of all module states
   */
  snapshots(): Array<{ module: string; data: unknown }> {
    return Object.entries(this.#projections).map(([module, projection]) => ({
      module,
      data: projection.rebuild(),
    }))
  }
}
