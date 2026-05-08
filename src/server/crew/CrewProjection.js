const INITIAL_STATE = { volunteers: [], posts: [], schedule: null }

function applyEvent(state, event) {
  switch (event.type) {
    case 'VolunteerCreated':
      return { ...state, volunteers: [...state.volunteers, event.payload] }

    case 'VolunteerNameUpdated':
      return { ...state, volunteers: state.volunteers.map(v => v.id === event.payload.id ? event.payload : v) }

    case 'VolunteerDeleted':
      return {
        ...state,
        volunteers: state.volunteers.filter(v => v.id !== event.payload.volunteerId),
        schedule: state.schedule
          ? { ...state.schedule, assignments: state.schedule.assignments.filter(a => a.volunteerId !== event.payload.volunteerId) }
          : null,
      }

    case 'PostCreated':
      return { ...state, posts: [...state.posts, event.payload] }

    case 'PostNameUpdated':
    case 'SlotAddedToPost':
    case 'SlotUpdatedInPost':
      return { ...state, posts: state.posts.map(p => p.id === event.payload.id ? event.payload : p) }

    case 'PostDeleted': {
      const post = state.posts.find(p => p.id === event.payload.postId)
      const slotIds = post ? post.slots.map(s => s.id) : []
      return {
        ...state,
        posts: state.posts.filter(p => p.id !== event.payload.postId),
        schedule: state.schedule
          ? { ...state.schedule, assignments: state.schedule.assignments.filter(a => !slotIds.includes(a.slotId)) }
          : null,
      }
    }

    case 'SlotRemovedFromPost':
      return {
        ...state,
        posts: state.posts.map(p => p.id === event.payload.post.id ? event.payload.post : p),
        schedule: state.schedule
          ? { ...state.schedule, assignments: state.schedule.assignments.filter(a => a.slotId !== event.payload.slotId) }
          : null,
      }

    case 'VolunteerAssigned':
    case 'VolunteerUnassigned':
      return { ...state, schedule: event.payload }

    default:
      return state
  }
}

export class CrewProjection {
  #store

  constructor(eventStore) {
    this.#store = eventStore
  }

  rebuild() {
    const events = this.#store.replayModule('crew')
    return events.reduce(applyEvent, INITIAL_STATE)
  }
}
