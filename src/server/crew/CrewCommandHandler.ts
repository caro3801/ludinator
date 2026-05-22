import { CreateVolunteer } from '../../crew/application/usecases/CreateVolunteer'
import { UpdateVolunteerName } from '../../crew/application/usecases/UpdateVolunteerName'
import { DeleteVolunteer } from '../../crew/application/usecases/DeleteVolunteer'
import { CreatePost } from '../../crew/application/usecases/CreatePost'
import { UpdatePostName } from '../../crew/application/usecases/UpdatePostName'
import { DeletePost } from '../../crew/application/usecases/DeletePost'
import { AddSlotToPost } from '../../crew/application/usecases/AddSlotToPost'
import { RemoveSlotFromPost } from '../../crew/application/usecases/RemoveSlotFromPost'
import { UpdateSlotInPost } from '../../crew/application/usecases/UpdateSlotInPost'
import { AssignVolunteer } from '../../crew/application/usecases/AssignVolunteer'
import { UnassignVolunteer } from '../../crew/application/usecases/UnassignVolunteer'
import { CrewProjection } from './CrewProjection'
import { CrewDomainEvent } from '../../crew/domain/events'

const EDITION_ID = 'edition-2024'

interface CrewState {
  volunteers: { id: string; name: string }[]
  posts: { id: string; name: string; minVolunteers: number; slots: { id: string; window: { day: string; startTime: string; endTime: string } }[] }[]
  schedule: { id: string; editionId: string; assignments: { id: string; volunteerId: string; slotId: string }[] } | null
}

/**
 * Handles commands for the Crew module
 */
export class CrewCommandHandler {
  readonly #projection: CrewProjection

  constructor(projection: CrewProjection) {
    this.#projection = projection
  }

  /**
   * Execute a command and return the domain event
   */
  execute(action: string, payload: unknown): CrewDomainEvent {
    const state = this.#projection.rebuild() as CrewState

    type CreateVolunteerPayload = { name: string }
    type UpdateVolunteerNamePayload = { volunteerId: string; name: string }
    type DeleteVolunteerPayload = { volunteerId: string }
    type CreatePostPayload = { name: string; minVolunteers: number }
    type UpdatePostNamePayload = { postId: string; name: string }
    type DeletePostPayload = { postId: string }
    type AddSlotToPostPayload = { postId: string; day: string; startTime: string; endTime: string }
    type RemoveSlotFromPostPayload = { postId: string; slotId: string }
    type UpdateSlotInPostPayload = { postId: string; slotId: string; day: string; startTime: string; endTime: string }
    type AssignVolunteerPayload = { volunteerId: string; slotId: string }
    type UnassignVolunteerPayload = { assignmentId: string }

    switch (action) {
      case 'CreateVolunteer':
        return new CreateVolunteer().execute(payload as CreateVolunteerPayload)

      case 'UpdateVolunteerName': {
        const volunteer = state.volunteers.find((v) => v.id === (payload as UpdateVolunteerNamePayload).volunteerId)
        if (!volunteer) throw new Error(`Volunteer not found: ${(payload as UpdateVolunteerNamePayload).volunteerId}`)
        return new UpdateVolunteerName().execute({ volunteer, name: (payload as UpdateVolunteerNamePayload).name })
      }

      case 'DeleteVolunteer':
        return new DeleteVolunteer().execute(payload as DeleteVolunteerPayload)

      case 'CreatePost':
        return new CreatePost().execute(payload as CreatePostPayload)

      case 'UpdatePostName': {
        const post = state.posts.find((p) => p.id === (payload as UpdatePostNamePayload).postId)
        if (!post) throw new Error(`Post not found: ${(payload as UpdatePostNamePayload).postId}`)
        return new UpdatePostName().execute({ post, name: (payload as UpdatePostNamePayload).name })
      }

      case 'DeletePost':
        return new DeletePost().execute(payload as DeletePostPayload)

      case 'AddSlotToPost': {
        const post = state.posts.find((p) => p.id === (payload as AddSlotToPostPayload).postId)
        if (!post) throw new Error(`Post not found: ${(payload as AddSlotToPostPayload).postId}`)
        const p = payload as AddSlotToPostPayload
        return new AddSlotToPost().execute({ post, day: p.day, startTime: p.startTime, endTime: p.endTime })
      }

      case 'RemoveSlotFromPost': {
        const post = state.posts.find((p) => p.id === (payload as RemoveSlotFromPostPayload).postId)
        if (!post) throw new Error(`Post not found: ${(payload as RemoveSlotFromPostPayload).postId}`)
        return new RemoveSlotFromPost().execute({ post, slotId: (payload as RemoveSlotFromPostPayload).slotId })
      }

      case 'UpdateSlotInPost': {
        const post = state.posts.find((p) => p.id === (payload as UpdateSlotInPostPayload).postId)
        if (!post) throw new Error(`Post not found: ${(payload as UpdateSlotInPostPayload).postId}`)
        const p = payload as UpdateSlotInPostPayload
        return new UpdateSlotInPost().execute({ post, slotId: p.slotId, day: p.day, startTime: p.startTime, endTime: p.endTime })
      }

      case 'AssignVolunteer': {
        const volunteer = state.volunteers.find((v) => v.id === (payload as AssignVolunteerPayload).volunteerId)
        if (!volunteer) throw new Error(`Volunteer not found: ${(payload as AssignVolunteerPayload).volunteerId}`)
        let slot: { id: string; postId: string; window: { day: string; startTime: string; endTime: string } } | null = null
        const slotId = (payload as AssignVolunteerPayload).slotId
        for (const post of state.posts) {
          const found = post.slots.find((s) => s.id === slotId)
          if (found) { slot = { id: found.id, postId: post.id, window: found.window }; break }
        }
        if (!slot) throw new Error(`Slot not found: ${slotId}`)
        return new AssignVolunteer().execute({ volunteer, slot, schedule: state.schedule, editionId: EDITION_ID })
      }

      case 'UnassignVolunteer': {
        if (!state.schedule) throw new Error('No schedule found')
        return new UnassignVolunteer().execute({ schedule: state.schedule, assignmentId: (payload as UnassignVolunteerPayload).assignmentId })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}
