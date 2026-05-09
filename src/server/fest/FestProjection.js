const INITIAL_STATE = { activities: [], entryLog: null }

function applyEvent(state, event) {
  switch (event.type) {
    case 'ActivityCreated':
      return { ...state, activities: [...state.activities, event.payload] }

    case 'ActivityNameUpdated':
    case 'SlotAddedToActivity':
    case 'RegistrationAdded':
    case 'RegistrationUpdated':
    case 'RegistrationCancelled':
      return { ...state, activities: state.activities.map(a => a.id === event.payload.id ? event.payload : a) }

    case 'ActivityDeleted':
      return { ...state, activities: state.activities.filter(a => a.id !== event.payload.activityId) }

    case 'SubCounterAdded':
    case 'SubCounterRemoved':
    case 'EntriesRecorded':
    case 'SubCounterBatchUpdated':
    case 'SubCounterBatchDeleted':
      return { ...state, entryLog: event.payload }

    default:
      return state
  }
}

export class FestProjection {
  #store

  constructor(eventStore) {
    this.#store = eventStore
  }

  rebuild() {
    const events = this.#store.replayModule('fest')
    return events.reduce(applyEvent, INITIAL_STATE)
  }
}
