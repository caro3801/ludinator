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
import { CopySlotsToPost } from '../../crew/application/usecases/CopySlotsToPost'
import { CrewProjection } from './CrewProjection'
import { VolunteerId, PostId, CrewSlotId, EditionId, ScheduleId } from '../../shared/types'

const EDITION_ID: EditionId = 'edition-2024'

interface Volunteer {
  id: VolunteerId
  name: string
}

interface TimeWindow {
  day: string
  startTime: string
  endTime: string
}

interface CrewSlot {
  id: CrewSlotId
  postId: PostId
  window: TimeWindow
}

interface Post {
  id: PostId
  name: string
  minVolunteers: number
  slots: CrewSlot[]
}

interface Assignment {
  id: string
  volunteerId: VolunteerId
  slotId: CrewSlotId
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

type CrewDomainEvent = {
  type: string
  module: string
  aggregateId: string | null
  payload: unknown
  occurredAt: string
}

type CreateVolunteerPayload = { name: string }
type UpdateVolunteerNamePayload = { volunteerId: VolunteerId; name: string }
type DeleteVolunteerPayload = { volunteerId: VolunteerId }
type CreatePostPayload = { name: string; minVolunteers: number }
type UpdatePostNamePayload = { postId: PostId; name: string }
type DeletePostPayload = { postId: PostId }
type AddSlotToPostPayload = { postId: PostId; day: string; startTime: string; endTime: string }
type RemoveSlotFromPostPayload = { postId: PostId; slotId: CrewSlotId }
type UpdateSlotInPostPayload = { postId: PostId; slotId: CrewSlotId; day: string; startTime: string; endTime: string }
type AssignVolunteerPayload = { volunteerId: VolunteerId; slotId: CrewSlotId }
type UnassignVolunteerPayload = { assignmentId: string }
type CopySlotsToPostPayload = { sourcePostId: PostId; targetPostId: PostId }

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
  async execute(action: string, payload: unknown): Promise<CrewDomainEvent> {
    const state = this.#projection.rebuild() as CrewState

    // Simple in-memory repository implementations based on current state
    const volunteerRepo = {
      findAll: async (): Promise<{ id: VolunteerId; name: string }[]> => state.volunteers,
      findById: async (id: VolunteerId): Promise<{ id: VolunteerId; name: string } | null> => {
        return state.volunteers.find(v => v.id === id) ?? null
      },
      save: async (_volunteer: unknown): Promise<void> => {},
      delete: async (_id: VolunteerId): Promise<void> => {},
    }

    switch (action) {
      case 'CreateVolunteer':
        return await new CreateVolunteer(volunteerRepo as any).execute(payload as CreateVolunteerPayload)

      case 'UpdateVolunteerName': {
        const p = payload as UpdateVolunteerNamePayload
        const volunteer = state.volunteers.find((v) => v.id === p.volunteerId)
        if (!volunteer) throw new Error(`Volunteer not found: ${p.volunteerId}`)
        return new UpdateVolunteerName().execute({ volunteer, name: p.name })
      }

      case 'DeleteVolunteer':
        return new DeleteVolunteer().execute(payload as DeleteVolunteerPayload)

      case 'CreatePost':
        return new CreatePost().execute(payload as CreatePostPayload)

      case 'UpdatePostName': {
        const p = payload as UpdatePostNamePayload
        const post = state.posts.find((p2) => p2.id === p.postId)
        if (!post) throw new Error(`Post not found: ${p.postId}`)
        return new UpdatePostName().execute({ post, name: p.name })
      }

      case 'DeletePost':
        return new DeletePost().execute(payload as DeletePostPayload)

      case 'AddSlotToPost': {
        const p = payload as AddSlotToPostPayload
        const post = state.posts.find((p2) => p2.id === p.postId)
        if (!post) throw new Error(`Post not found: ${p.postId}`)
        return new AddSlotToPost().execute({ post, day: p.day, startTime: p.startTime, endTime: p.endTime })
      }

      case 'RemoveSlotFromPost': {
        const p = payload as RemoveSlotFromPostPayload
        const post = state.posts.find((p2) => p2.id === p.postId)
        if (!post) throw new Error(`Post not found: ${p.postId}`)
        return new RemoveSlotFromPost().execute({ post, slotId: p.slotId })
      }

      case 'UpdateSlotInPost': {
        const p = payload as UpdateSlotInPostPayload
        const post = state.posts.find((p2) => p2.id === p.postId)
        if (!post) throw new Error(`Post not found: ${p.postId}`)
        return new UpdateSlotInPost().execute({ post, slotId: p.slotId, day: p.day, startTime: p.startTime, endTime: p.endTime })
      }

      case 'AssignVolunteer': {
        const p = payload as AssignVolunteerPayload
        const volunteer = state.volunteers.find((v) => v.id === p.volunteerId)
        if (!volunteer) throw new Error(`Volunteer not found: ${p.volunteerId}`)
        let slot: { id: CrewSlotId; postId: PostId; window: TimeWindow } | null = null
        for (const post of state.posts) {
          const found = post.slots.find((s) => s.id === p.slotId)
          if (found) { slot = { id: found.id, postId: post.id, window: found.window }; break }
        }
        if (!slot) throw new Error(`Slot not found: ${p.slotId}`)
        return new AssignVolunteer().execute({ volunteer, slot, schedule: state.schedule, editionId: EDITION_ID })
      }

      case 'UnassignVolunteer': {
        const p = payload as UnassignVolunteerPayload
        if (!state.schedule) throw new Error('No schedule found')
        return new UnassignVolunteer().execute({ schedule: state.schedule, assignmentId: p.assignmentId })
      }

      case 'CopySlotsToPost': {
        const p = payload as CopySlotsToPostPayload
        const sourcePost = state.posts.find((post) => post.id === p.sourcePostId)
        const targetPost = state.posts.find((post) => post.id === p.targetPostId)
        if (!sourcePost) throw new Error(`Source post not found: ${p.sourcePostId}`)
        if (!targetPost) throw new Error(`Target post not found: ${p.targetPostId}`)
        return new CopySlotsToPost().execute({ sourcePost, targetPost })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}
