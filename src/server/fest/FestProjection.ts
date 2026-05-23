import { EventStore } from '../EventStore'
import { ActivityId, EntryId, FestSlotId, RegistrationId } from '../../shared/types'

interface TimeWindow {
  day: string
  startTime: string
  endTime: string
}

interface Slot {
  id: FestSlotId
  activityId: ActivityId
  window: TimeWindow
  min: number | null
  max: number | null
  registrations: Registration[]
}

interface Activity {
  id: ActivityId
  name: string
  location: string | null
  slots: Slot[]
}

interface Registration {
  id: RegistrationId
  personName: string
}

interface Batch {
  id: string
  adults: number
  children: number
  families: number
  recordedAt: number
}

interface SubCounter {
  id: string
  label: string
  batches: Batch[]
}

interface EntryLog {
  id: EntryId
  editionId: string
  subCounters: SubCounter[]
}

interface FestState {
  activities: Activity[]
  entryLog: EntryLog | null
}

const INITIAL_STATE: FestState = { activities: [], entryLog: null }

// Event payload types for type-safe event handling
type ActivityCreatedEvent = { type: 'ActivityCreated'; payload: Activity }
type ActivityNameUpdatedEvent = { type: 'ActivityNameUpdated'; payload: Activity }
type SlotAddedToActivityEvent = { type: 'SlotAddedToActivity'; payload: Activity }
type RegistrationAddedEvent = { type: 'RegistrationAdded'; payload: Activity }
type RegistrationUpdatedEvent = { type: 'RegistrationUpdated'; payload: Activity }
type RegistrationCancelledEvent = { type: 'RegistrationCancelled'; payload: Activity }
type ActivityDeletedEvent = { type: 'ActivityDeleted'; payload: { activityId: ActivityId } }
type SubCounterAddedEvent = { type: 'SubCounterAdded'; payload: EntryLog }
type SubCounterRemovedEvent = { type: 'SubCounterRemoved'; payload: EntryLog }
type EntriesRecordedEvent = { type: 'EntriesRecorded'; payload: EntryLog }
type SubCounterBatchUpdatedEvent = { type: 'SubCounterBatchUpdated'; payload: EntryLog }
type SubCounterBatchDeletedEvent = { type: 'SubCounterBatchDeleted'; payload: EntryLog }

type FestEvent =
  | ActivityCreatedEvent
  | ActivityNameUpdatedEvent
  | SlotAddedToActivityEvent
  | RegistrationAddedEvent
  | RegistrationUpdatedEvent
  | RegistrationCancelledEvent
  | ActivityDeletedEvent
  | SubCounterAddedEvent
  | SubCounterRemovedEvent
  | EntriesRecordedEvent
  | SubCounterBatchUpdatedEvent
  | SubCounterBatchDeletedEvent

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
        activities: state.activities.map((a) =>
          a.id === event.payload.id ? event.payload : a
        ),
      }

    case 'ActivityDeleted':
      return {
        ...state,
        activities: state.activities.filter(
          (a) => a.id !== event.payload.activityId
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
    const replayedEvents = this.#store.replayModule('fest')
    const events: FestEvent[] = replayedEvents.map((e) => ({
      type: e.type,
      payload: e.payload,
    })) as FestEvent[]
    return events.reduce(applyEvent, { ...INITIAL_STATE })
  }
}
