import { EventStore } from '../EventStore'

interface CrewState {
  volunteers: unknown[]
  posts: unknown[]
  schedule: unknown | null
}

const INITIAL_STATE: CrewState = { volunteers: [], posts: [], schedule: null }

interface CrewEvent {
  type: string
  payload: unknown
}

function applyEvent(state: CrewState, event: CrewEvent): CrewState {
  switch (event.type) {
    case 'VolunteerCreated':
      return { ...state, volunteers: [...state.volunteers, event.payload] }

    case 'VolunteerNameUpdated':
      return {
        ...state,
        volunteers: state.volunteers.map((v: { id: string }) =>
          v.id === (event.payload as { id: string }).id ? event.payload : v
        ),
      }

    case 'VolunteerDeleted':
      return {
        ...state,
        volunteers: state.volunteers.filter(
          (v: { id: string }) => v.id !== (event.payload as { volunteerId: string }).volunteerId
        ),
        schedule: state.schedule
          ? {
              ...state.schedule,
              assignments: (state.schedule as { assignments: { volunteerId: string }[] }).assignments.filter(
                (a: { volunteerId: string }) => a.volunteerId !== (event.payload as { volunteerId: string }).volunteerId
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
        posts: state.posts.map((p: { id: string }) =>
          p.id === (event.payload as { id: string }).id ? event.payload : p
        ),
      }

    case 'PostDeleted': {
      const post = state.posts.find((p: { id: string }) => p.id === (event.payload as { postId: string }).postId) as { slots: { id: string }[] } | undefined
      const slotIds = post ? post.slots.map((s: { id: string }) => s.id) : []
      return {
        ...state,
        posts: state.posts.filter((p: { id: string }) => p.id !== (event.payload as { postId: string }).postId),
        schedule: state.schedule
          ? {
              ...state.schedule,
              assignments: (state.schedule as { assignments: { slotId: string }[] }).assignments.filter(
                (a: { slotId: string }) => !slotIds.includes(a.slotId)
              ),
            }
          : null,
      }
    }

    case 'SlotRemovedFromPost':
      return {
        ...state,
        posts: state.posts.map((p: { id: string }) =>
          p.id === (event.payload as { post: { id: string } }).post.id ? event.payload : p
        ),
        schedule: state.schedule
          ? {
              ...state.schedule,
              assignments: (state.schedule as { assignments: { slotId: string }[] }).assignments.filter(
                (a: { slotId: string }) => a.slotId !== (event.payload as { slotId: string }).slotId
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
    const events = this.#store.replayModule('crew')
    return events.reduce(applyEvent, { ...INITIAL_STATE })
  }
}
