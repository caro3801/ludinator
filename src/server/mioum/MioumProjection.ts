import { EventStore } from '../EventStore'

interface MioumState {
  products: unknown[]
  tickets: unknown[]
  currentTicket: unknown | null
}

const INITIAL_STATE: MioumState = { products: [], tickets: [], currentTicket: null }

interface MioumEvent {
  type: string
  payload: unknown
}

function applyEvent(state: MioumState, event: MioumEvent): MioumState {
  switch (event.type) {
    case 'ProductCreated':
      return { ...state, products: [...state.products, event.payload] }

    case 'ProductUpdated':
      return {
        ...state,
        products: state.products.map((p: { id: string }) =>
          p.id === (event.payload as { id: string }).id ? event.payload : p
        ),
      }

    case 'ProductDeleted':
      return {
        ...state,
        products: state.products.filter(
          (p: { id: string }) => p.id !== (event.payload as { productId: string }).productId
        ),
      }

    case 'TicketOpened':
      return { ...state, currentTicket: event.payload }

    case 'LineAddedToTicket':
    case 'LineRemovedFromTicket':
    case 'LineDecremented':
      return {
        ...state,
        currentTicket:
          state.currentTicket && (state.currentTicket as { id: string }).id === (event.payload as { id: string }).id
            ? event.payload
            : state.currentTicket,
      }

    case 'TicketClosed':
    case 'TicketCancelled':
      return {
        ...state,
        tickets: state.tickets.map((t: { id: string }) =>
          t.id === (event.payload as { id: string }).id ? event.payload : t
        ).concat(
          state.tickets.find((t: { id: string }) => t.id === (event.payload as { id: string }).id) ? [] : [event.payload]
        ),
        currentTicket:
          state.currentTicket && (state.currentTicket as { id: string }).id === (event.payload as { id: string }).id
            ? null
            : state.currentTicket,
      }

    case 'TicketReopened':
      return {
        ...state,
        tickets: state.tickets.filter((t: { id: string }) => t.id !== (event.payload as { id: string }).id),
        currentTicket: event.payload,
      }

    default:
      return state
  }
}

/**
 * Projection for Mioum module - rebuilds state from events
 */
export class MioumProjection {
  readonly #store: EventStore

  constructor(eventStore: EventStore) {
    this.#store = eventStore
  }

  /**
   * Rebuild the current state by replaying all events
   */
  rebuild(): MioumState {
    const events = this.#store.replayModule('mioum')
    return events.reduce(applyEvent, { ...INITIAL_STATE })
  }
}
