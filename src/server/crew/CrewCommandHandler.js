import { CreateVolunteer } from '../../crew/application/usecases/CreateVolunteer.js'
import { UpdateVolunteerName } from '../../crew/application/usecases/UpdateVolunteerName.js'
import { DeleteVolunteer } from '../../crew/application/usecases/DeleteVolunteer.js'
import { CreatePost } from '../../crew/application/usecases/CreatePost.js'
import { UpdatePostName } from '../../crew/application/usecases/UpdatePostName.js'
import { DeletePost } from '../../crew/application/usecases/DeletePost.js'
import { AddSlotToPost } from '../../crew/application/usecases/AddSlotToPost.js'
import { RemoveSlotFromPost } from '../../crew/application/usecases/RemoveSlotFromPost.js'
import { UpdateSlotInPost } from '../../crew/application/usecases/UpdateSlotInPost.js'
import { AssignVolunteer } from '../../crew/application/usecases/AssignVolunteer.js'
import { UnassignVolunteer } from '../../crew/application/usecases/UnassignVolunteer.js'

const EDITION_ID = 'edition-2024'

export class CrewCommandHandler {
  #projection

  constructor(projection) {
    this.#projection = projection
  }

  execute(action, payload) {
    const state = this.#projection.rebuild()

    switch (action) {
      case 'CreateVolunteer':
        return new CreateVolunteer().execute(payload)

      case 'UpdateVolunteerName': {
        const volunteer = state.volunteers.find(v => v.id === payload.volunteerId)
        if (!volunteer) throw new Error(`Volunteer not found: ${payload.volunteerId}`)
        return new UpdateVolunteerName().execute({ volunteer, name: payload.name })
      }

      case 'DeleteVolunteer':
        return new DeleteVolunteer().execute(payload)

      case 'CreatePost':
        return new CreatePost().execute(payload)

      case 'UpdatePostName': {
        const post = state.posts.find(p => p.id === payload.postId)
        if (!post) throw new Error(`Post not found: ${payload.postId}`)
        return new UpdatePostName().execute({ post, name: payload.name })
      }

      case 'DeletePost':
        return new DeletePost().execute(payload)

      case 'AddSlotToPost': {
        const post = state.posts.find(p => p.id === payload.postId)
        if (!post) throw new Error(`Post not found: ${payload.postId}`)
        return new AddSlotToPost().execute({ post, day: payload.day, startTime: payload.startTime, endTime: payload.endTime })
      }

      case 'RemoveSlotFromPost': {
        const post = state.posts.find(p => p.id === payload.postId)
        if (!post) throw new Error(`Post not found: ${payload.postId}`)
        return new RemoveSlotFromPost().execute({ post, slotId: payload.slotId })
      }

      case 'UpdateSlotInPost': {
        const post = state.posts.find(p => p.id === payload.postId)
        if (!post) throw new Error(`Post not found: ${payload.postId}`)
        return new UpdateSlotInPost().execute({ post, slotId: payload.slotId, day: payload.day, startTime: payload.startTime, endTime: payload.endTime })
      }

      case 'AssignVolunteer': {
        const volunteer = state.volunteers.find(v => v.id === payload.volunteerId)
        if (!volunteer) throw new Error(`Volunteer not found: ${payload.volunteerId}`)
        let slot = null
        for (const post of state.posts) {
          const found = post.slots.find(s => s.id === payload.slotId)
          if (found) { slot = found; break }
        }
        if (!slot) throw new Error(`Slot not found: ${payload.slotId}`)
        return new AssignVolunteer().execute({ volunteer, slot, schedule: state.schedule, editionId: EDITION_ID })
      }

      case 'UnassignVolunteer': {
        if (!state.schedule) throw new Error('No schedule found')
        return new UnassignVolunteer().execute({ schedule: state.schedule, assignmentId: payload.assignmentId })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}
