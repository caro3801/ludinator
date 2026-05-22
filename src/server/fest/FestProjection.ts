import { EventStore } from '../EventStore'

interface FestState {
  activities: unknown[]
  entryLog: unknown | null
}

const INITIAL_STATE: FestState = { activities: [], entryLog: null }

interface FestEvent {
  type: string
  payload: unknown
}

function applyEvent(state: FestState, event: FestEvent): FestState {
  switch (event.type) {
    case 'ActivityCreated':
      return { ...state, activities: [...state.activities, event.payload] }

    case 'ActivityNameUpdated':
    case 'SlotAddedToActivity':
    case 'RegistrationAdded':
    case 'RegistrationUpdated':
    case 'RegistrationCancelled':
      return {
        ...state,
        activities: state.activities.map((a: { id: string }) =>
          a.id === (event.payload as { id: string }).id ? event.payload : a
        ),
      }

    case 'ActivityDeleted':
      return {
        ...state,
        activities: state.activities.filter(
          (a: { id: string }) => a.id !== (event.payload as { activityId: string }).activityId
        ),
      }

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

/**
 * Projection for Fest module - rebuilds state from events
 */
export class FestProjection {
  readonly #store: EventStore

  constructor(eventStore: EventStore) {
    this.#store = eventStore
  }

  /**
   * Rebuild the current state by replaying all events
   */
  rebuild(): FestState {
    const events = this.#store.replayModule('fest')
    return events.reduce(applyEvent, { ...INITIAL_STATE })
  }
}
