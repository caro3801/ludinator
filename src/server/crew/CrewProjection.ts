import { EventStore } from '../EventStore'
import { VolunteerId, PostId, ScheduleId, SlotId, EditionId } from '../../shared/types'

interface Volunteer {
  id: VolunteerId
  name: string
}

interface TimeWindow {
  day: string
  startTime: string
  endTime: string
}

interface Slot {
  id: SlotId
  postId: PostId
  window: TimeWindow
}

interface Post {
  id: PostId
  name: string
  minVolunteers: number
  slots: Slot[]
}

interface Assignment {
  id: string
  volunteerId: VolunteerId
  slotId: SlotId
}

interface Schedule {
  id: ScheduleId
  editionId: EditionId
  assignments: Assignment[]
}

interface CrewState {
  volunteers: Volunteer[]
  posts: Post[]
  schedule: Schedule | null
}

const INITIAL_STATE: CrewState = { volunteers: [], posts: [], schedule: null }

// Event payload types for type-safe event handling
type VolunteerCreatedEvent = { type: 'VolunteerCreated'; payload: Volunteer }
type VolunteerNameUpdatedEvent = { type: 'VolunteerNameUpdated'; payload: Volunteer }
type VolunteerDeletedEvent = { type: 'VolunteerDeleted'; payload: { volunteerId: VolunteerId } }
type PostCreatedEvent = { type: 'PostCreated'; payload: Post }
type PostNameUpdatedEvent = { type: 'PostNameUpdated'; payload: Post }
type SlotAddedToPostEvent = { type: 'SlotAddedToPost'; payload: Post }
type SlotUpdatedInPostEvent = { type: 'SlotUpdatedInPost'; payload: Post }
type PostDeletedEvent = { type: 'PostDeleted'; payload: { postId: PostId } }
type SlotRemovedFromPostEvent = { type: 'SlotRemovedFromPost'; payload: { post: Post; slotId: SlotId } }
type VolunteerAssignedEvent = { type: 'VolunteerAssigned'; payload: Schedule }
type VolunteerUnassignedEvent = { type: 'VolunteerUnassigned'; payload: Schedule }

type CrewEvent =
  | VolunteerCreatedEvent
  | VolunteerNameUpdatedEvent
  | VolunteerDeletedEvent
  | PostCreatedEvent
  | PostNameUpdatedEvent
  | SlotAddedToPostEvent
  | SlotUpdatedInPostEvent
  | PostDeletedEvent
  | SlotRemovedFromPostEvent
  | VolunteerAssignedEvent
  | VolunteerUnassignedEvent

function applyEvent(state: CrewState, event: CrewEvent): CrewState {
  switch (event.type) {
    case 'VolunteerCreated':
      return { ...state, volunteers: [...state.volunteers, event.payload] }

    case 'VolunteerNameUpdated':
      return {
        ...state,
        volunteers: state.volunteers.map((v) =>
          v.id === event.payload.id ? event.payload : v
        ),
      }

    case 'VolunteerDeleted':
      return {
        ...state,
        volunteers: state.volunteers.filter(
          (v) => v.id !== event.payload.volunteerId
        ),
        schedule: state.schedule
          ? {
              ...state.schedule,
              assignments: state.schedule.assignments.filter(
                (a) => a.volunteerId !== event.payload.volunteerId
              ),
            }
          : null,
      }

    case 'PostCreated':
      return { ...state, posts: [...state.posts, event.payload] }

    case 'PostNameUpdated':
    case 'SlotAddedToPost':
    case 'SlotUpdatedInPost':
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === event.payload.id ? event.payload : p
        ),
      }

    case 'PostDeleted': {
      const post = state.posts.find((p) => p.id === event.payload.postId)
      const slotIds = post ? post.slots.map((s) => s.id) : []
      return {
        ...state,
        posts: state.posts.filter((p) => p.id !== event.payload.postId),
        schedule: state.schedule
          ? {
              ...state.schedule,
              assignments: state.schedule.assignments.filter(
                (a) => !slotIds.includes(a.slotId)
              ),
            }
          : null,
      }
    }

    case 'SlotRemovedFromPost':
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === event.payload.post.id ? event.payload.post : p
        ),
        schedule: state.schedule
          ? {
              ...state.schedule,
              assignments: state.schedule.assignments.filter(
                (a) => a.slotId !== event.payload.slotId
              ),
            }
          : null,
      }

    case 'VolunteerAssigned':
    case 'VolunteerUnassigned':
      return { ...state, schedule: event.payload }

    default:
      return state
  }
}

/**
 * Projection for Crew module - rebuilds state from events
 */
export class CrewProjection {
  readonly #store: EventStore

  constructor(eventStore: EventStore) {
    this.#store = eventStore
  }

  /**
   * Rebuild the current state by replaying all events
   */
  rebuild(): CrewState {
    const replayedEvents = this.#store.replayModule('crew')
    const events: CrewEvent[] = replayedEvents.map((e) => ({
      type: e.type,
      payload: e.payload,
    })) as CrewEvent[]
    return events.reduce(applyEvent, { ...INITIAL_STATE })
  }
}
