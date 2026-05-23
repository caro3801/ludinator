import { EventStore } from '../EventStore'
import { ProductId, TicketId, TicketLineId } from '../../shared/types'

interface Product {
  id: ProductId
  name: string
  price: number
  category: string
}

interface TicketLine {
  id: TicketLineId
  productId: ProductId
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

interface Ticket {
  id: TicketId
  lines: TicketLine[]
  status: 'open' | 'closed' | 'cancelled'
  paymentMethod: string | null
  closedAt: number | null
  total: number
}

interface CurrentTicket {
  id: TicketId
  lines: TicketLine[]
  status: 'open' | 'closed' | 'cancelled'
  paymentMethod: string | null
  closedAt: number | null
  total: number
}

interface MioumState {
  products: Product[]
  tickets: Ticket[]
  currentTicket: CurrentTicket | null
}

const INITIAL_STATE: MioumState = { products: [], tickets: [], currentTicket: null }

// Event payload types for type-safe event handling
type ProductCreatedEvent = { type: 'ProductCreated'; payload: Product }
type ProductUpdatedEvent = { type: 'ProductUpdated'; payload: Product }
type ProductDeletedEvent = { type: 'ProductDeleted'; payload: { productId: ProductId } }
type TicketOpenedEvent = { type: 'TicketOpened'; payload: CurrentTicket }
type LineAddedToTicketEvent = { type: 'LineAddedToTicket'; payload: CurrentTicket }
type LineRemovedFromTicketEvent = { type: 'LineRemovedFromTicket'; payload: CurrentTicket }
type LineDecrementedEvent = { type: 'LineDecremented'; payload: CurrentTicket }
type TicketClosedEvent = { type: 'TicketClosed'; payload: Ticket }
type TicketCancelledEvent = { type: 'TicketCancelled'; payload: Ticket }
type TicketReopenedEvent = { type: 'TicketReopened'; payload: CurrentTicket }

type MioumEvent =
  | ProductCreatedEvent
  | ProductUpdatedEvent
  | ProductDeletedEvent
  | TicketOpenedEvent
  | LineAddedToTicketEvent
  | LineRemovedFromTicketEvent
  | LineDecrementedEvent
  | TicketClosedEvent
  | TicketCancelledEvent
  | TicketReopenedEvent

function applyEvent(state: MioumState, event: MioumEvent): MioumState {
  switch (event.type) {
    case 'ProductCreated':
      return { ...state, products: [...state.products, event.payload] }

    case 'ProductUpdated':
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === event.payload.id ? event.payload : p
        ),
      }

    case 'ProductDeleted':
      return {
        ...state,
        products: state.products.filter(
          (p) => p.id !== event.payload.productId
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
          state.currentTicket && state.currentTicket.id === event.payload.id
            ? event.payload
            : state.currentTicket,
      }

    case 'TicketClosed':
    case 'TicketCancelled':
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === event.payload.id ? event.payload : t
        ).concat(
          state.tickets.find((t) => t.id === event.payload.id) ? [] : [event.payload]
        ),
        currentTicket:
          state.currentTicket && state.currentTicket.id === event.payload.id
            ? null
            : state.currentTicket,
      }

    case 'TicketReopened':
      return {
        ...state,
        tickets: state.tickets.filter((t) => t.id !== event.payload.id),
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
    const replayedEvents = this.#store.replayModule('mioum')
    const events: MioumEvent[] = replayedEvents.map((e) => ({
      type: e.type,
      payload: e.payload,
    })) as MioumEvent[]
    return events.reduce(applyEvent, { ...INITIAL_STATE })
  }
}
