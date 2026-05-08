const INITIAL_STATE = { products: [], tickets: [], currentTicket: null }

function applyEvent(state, event) {
  switch (event.type) {
    case 'ProductCreated':
      return { ...state, products: [...state.products, event.payload] }

    case 'ProductUpdated':
      return { ...state, products: state.products.map(p => p.id === event.payload.id ? event.payload : p) }

    case 'ProductDeleted':
      return { ...state, products: state.products.filter(p => p.id !== event.payload.productId) }

    case 'TicketOpened':
      return { ...state, currentTicket: event.payload }

    case 'LineAddedToTicket':
    case 'LineRemovedFromTicket':
    case 'LineDecremented':
      return { ...state, currentTicket: state.currentTicket?.id === event.payload.id ? event.payload : state.currentTicket }

    case 'TicketClosed':
    case 'TicketCancelled':
      return {
        ...state,
        tickets: state.tickets.map(t => t.id === event.payload.id ? event.payload : t).concat(
          state.tickets.find(t => t.id === event.payload.id) ? [] : [event.payload]
        ),
        currentTicket: state.currentTicket?.id === event.payload.id ? null : state.currentTicket,
      }

    case 'TicketReopened':
      return {
        ...state,
        tickets: state.tickets.filter(t => t.id !== event.payload.id),
        currentTicket: event.payload,
      }

    default:
      return state
  }
}

export class MioumProjection {
  #store

  constructor(eventStore) {
    this.#store = eventStore
  }

  rebuild() {
    const events = this.#store.replayModule('mioum')
    return events.reduce(applyEvent, INITIAL_STATE)
  }
}
