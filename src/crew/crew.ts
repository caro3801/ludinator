import { Volunteer } from './domain/model/Volunteer'
import { Post } from './domain/model/Post'
import { Schedule } from './domain/model/Schedule'
import { VolunteerCreated, PostCreated } from './domain/events'
import { CreateVolunteer } from './application/usecases/CreateVolunteer'
import { UpdateVolunteerName } from './application/usecases/UpdateVolunteerName'
import { CreatePost } from './application/usecases/CreatePost'
import { UpdatePostName } from './application/usecases/UpdatePostName'
import { AddSlotToPost } from './application/usecases/AddSlotToPost'
import { UpdateSlotInPost } from './application/usecases/UpdateSlotInPost'
import { AssignVolunteer } from './application/usecases/AssignVolunteer'
import { UnassignVolunteer } from './application/usecases/UnassignVolunteer'
import { DeleteVolunteer } from './application/usecases/DeleteVolunteer'
import { DeletePost } from './application/usecases/DeletePost'
import { RemoveSlotFromPost } from './application/usecases/RemoveSlotFromPost'
import { WsClient } from '../client/WsClient'
import { ScheduleRepository } from './ports/ScheduleRepository'
import { VolunteerRepository } from './ports/VolunteerRepository'
import { PostRepository } from './ports/PostRepository'
import { VolunteerId, PostId, SlotId, EditionId } from '../shared/types'

// Import all UI components to register them
import './adapters/ui/CrewVolunteerForm'
import './adapters/ui/CrewVolunteerList'
import './adapters/ui/CrewEditVolunteerNameForm'
import './adapters/ui/CrewPostForm'
import './adapters/ui/CrewPostList'
import './adapters/ui/CrewAddSlotForm'
import './adapters/ui/CrewEditSlotForm'
import './adapters/ui/CrewEditPostNameForm'
import './adapters/ui/CrewAssignForm'
import './adapters/ui/CrewPlanningView'
import './adapters/ui/CrewStatsView'
import './adapters/ui/CrewScheduleView'
import './adapters/ui/CrewVolunteerPlanningView'

const EDITION_ID: EditionId = 'edition-2024'
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const ws = new WsClient(`${wsProtocol}//${window.location.host}`)

// Types for custom elements
type VolunteerFormElement = HTMLElement & { createVolunteerUseCase: CreateVolunteer | null }
type VolunteerListElement = HTMLElement & { refresh: (repo: VolunteerRepository) => Promise<void> }
type EditVolunteerNameFormElement = HTMLElement & { updateVolunteerNameUseCase: { execute: (params: { volunteerId: string; name: string }) => Promise<{ id: string; name: { value: string } }> }; open: (detail: { volunteerId: string; name: string }) => void }
type PostFormElement = HTMLElement & { createPostUseCase: CreatePost | null }
type PostListElement = HTMLElement & { refresh: (repo: PostRepository) => Promise<void> }
type AddSlotFormElement = HTMLElement & { addSlotToPostUseCase: { execute: (params: { postId: string; day: string; startTime: string; endTime: string }) => Promise<unknown> }; posts: Post[] }
type EditSlotFormElement = HTMLElement & { updateSlotInPostUseCase: { execute: (params: { postId: string; slotId: string; day: string; startTime: string; endTime: string }) => Promise<unknown> }; open: (detail: { postId: string; slot: unknown }) => void }
type EditPostNameFormElement = HTMLElement & { updatePostNameUseCase: { execute: (params: { postId: string; name: string }) => Promise<unknown> }; open: (detail: { postId: string; name: string }) => void }
type AssignFormElement = HTMLElement & { editionId: EditionId; assignVolunteerUseCase: { execute: (params: { volunteerId: string; slotId: string; schedule: unknown; editionId: string }) => Promise<unknown> }; volunteers: Volunteer[]; posts: Post[]; selectSlot: (detail: { slotId: string; postId: string }) => void }
type PlanningViewElement = HTMLElement & { refresh: (params: { scheduleRepo: ScheduleRepository; volunteerRepo: VolunteerRepository; postRepo: PostRepository }, editionId: EditionId) => Promise<void> }
type StatsViewElement = HTMLElement & { refresh: (params: { scheduleRepo: ScheduleRepository; volunteerRepo: VolunteerRepository; postRepo: PostRepository }, editionId: EditionId) => Promise<void> }

// Get DOM elements with proper typing
const volunteerForm = document.querySelector<VolunteerFormElement>('crew-volunteer-form')
const volunteerList = document.querySelector<VolunteerListElement>('crew-volunteer-list')
const editVolunteerNameForm = document.querySelector<EditVolunteerNameFormElement>('crew-edit-volunteer-name-form')
const postForm = document.querySelector<PostFormElement>('crew-post-form')
const postList = document.querySelector<PostListElement>('crew-post-list')
const addSlotForm = document.querySelector<AddSlotFormElement>('crew-add-slot-form')
const editSlotForm = document.querySelector<EditSlotFormElement>('crew-edit-slot-form')
const editPostNameForm = document.querySelector<EditPostNameFormElement>('crew-edit-post-name-form')
const assignForm = document.querySelector<AssignFormElement>('crew-assign-form')
const planningView = document.querySelector<PlanningViewElement>('crew-planning-view')
const statsView = document.querySelector<StatsViewElement>('crew-stats-view')
const offlineBanner = document.getElementById('offline-banner')

const dispatchError = (msg: string): void => {
  document.dispatchEvent(new CustomEvent('crew-error', { detail: { message: msg } }))
}

// Configure use cases
if (volunteerForm) {
  volunteerForm.createVolunteerUseCase = new CreateVolunteer()
}

if (editVolunteerNameForm) {
  editVolunteerNameForm.updateVolunteerNameUseCase = {
    execute: async ({ volunteerId, name }: { volunteerId: string; name: string }) => {
      return { id: volunteerId, name: { value: name } }
    },
  }
}

if (postForm) {
  postForm.createPostUseCase = new CreatePost()
}

if (editPostNameForm) {
  editPostNameForm.updatePostNameUseCase = {
    execute: async ({ postId, name }: { postId: string; name: string }) => {
      return { id: postId, name: { value: name } }
    },
  }
}

if (addSlotForm) {
  addSlotForm.addSlotToPostUseCase = {
    execute: async ({ postId, day, startTime, endTime }: { postId: string; day: string; startTime: string; endTime: string }) => {
      const result = new AddSlotToPost().execute({ post: { id: postId as PostId, name: 'x', minVolunteers: 1, slots: [] }, day, startTime, endTime })
      return result
    },
  }
}

if (editSlotForm) {
  editSlotForm.updateSlotInPostUseCase = {
    execute: async ({ postId, slotId, day, startTime, endTime }: { postId: string; slotId: string; day: string; startTime: string; endTime: string }) => {
      const result = new UpdateSlotInPost().execute({ post: { id: postId as PostId, name: 'x', minVolunteers: 1, slots: [] }, slotId: slotId as SlotId, day, startTime, endTime })
      return result
    },
  }
}

if (assignForm) {
  assignForm.editionId = EDITION_ID
  assignForm.assignVolunteerUseCase = {
    execute: async ({ volunteerId, slotId, schedule, editionId }: { volunteerId: string; slotId: string; schedule: unknown; editionId: string }) => {
      const result = new AssignVolunteer().execute({ volunteer: { id: volunteerId as VolunteerId, name: 'x' }, slot: { id: slotId as SlotId, postId: 'x' as PostId, window: { day: 'x', startTime: '00:00', endTime: '01:00' } }, schedule: schedule as any, editionId: editionId as EditionId })
      return result
    },
  }
}

// Simple repository implementations for UI refresh
class InMemoryVolunteerRepo implements VolunteerRepository {
  constructor(private volunteers: Volunteer[]) {}
  async save(_volunteer: Volunteer): Promise<void> {}
  async findById(id: string): Promise<Volunteer | null> {
    return this.volunteers.find(v => v.id === id) ?? null
  }
  async findAll(): Promise<Volunteer[]> {
    return [...this.volunteers]
  }
  async delete(_id: string): Promise<void> {}
}

class InMemoryPostRepo implements PostRepository {
  constructor(private posts: Post[]) {}
  async save(_post: Post): Promise<void> {}
  async findById(id: string): Promise<Post | null> {
    return this.posts.find(p => p.id === id) ?? null
  }
  async findAll(): Promise<Post[]> {
    return [...this.posts]
  }
  async delete(_id: string): Promise<void> {}
}

class InMemoryScheduleRepo implements ScheduleRepository {
  constructor(private schedule: Schedule | null) {}
  async save(_schedule: Schedule): Promise<void> {}
  async findById(id: string): Promise<Schedule | null> {
    return this.schedule?.id === id ? this.schedule : null
  }
  async findAll(): Promise<Schedule[]> {
    return this.schedule ? [this.schedule] : []
  }
  async findByEdition(_editionId: string): Promise<Schedule | null> {
    return this.schedule
  }
  async delete(_id: string): Promise<void> {}
}

// Handle state updates from WebSocket
ws.onState('crew', (data: unknown) => {
  const { volunteers, posts, schedule } = data as { volunteers: unknown[]; posts: unknown[]; schedule: unknown | null }
  const domainVolunteers = volunteers.map((v: unknown) => Volunteer.fromJSON(v as { id: string; name: string }))
  const domainPosts = posts.map((p: unknown) => Post.fromJSON(p as { id: string; name: string; minVolunteers: number; slots: { id: string; postId: string; window: { day: string; startTime: string; endTime: string } }[] }))
  const domainSchedule = schedule ? Schedule.fromJSON(schedule as { id: string; editionId: string; assignments: unknown[] }) : null

  const volunteerRepo = new InMemoryVolunteerRepo(domainVolunteers)
  const postRepo = new InMemoryPostRepo(domainPosts)
  const scheduleRepo = new InMemoryScheduleRepo(domainSchedule)

  if (volunteerList) {
    volunteerList.refresh(volunteerRepo)
  }
  if (postList) {
    postList.refresh(postRepo)
  }
  if (addSlotForm) {
    addSlotForm.posts = domainPosts
  }
  if (assignForm) {
    assignForm.volunteers = domainVolunteers
    assignForm.posts = domainPosts
  }

  if (planningView) {
    planningView.refresh({ scheduleRepo, volunteerRepo, postRepo }, EDITION_ID)
  }

  if (statsView) {
    statsView.refresh({ scheduleRepo, volunteerRepo, postRepo }, EDITION_ID)
  }
})

ws.onConnectionChange(({ connected, queueLength }: { connected: boolean; queueLength: number }) => {
  if (offlineBanner) {
    offlineBanner.hidden = connected
    offlineBanner.textContent = `Hors ligne — ${queueLength} action(s) en attente`
  }
})

// Event listeners for domain events
interface VolunteerNameUpdatedDetail { volunteerId: string; name: string }
interface VolunteerDeleteRequestedDetail { volunteerId: string }
interface PostNameUpdatedDetail { postId: string; name: string }
interface PostEditNameRequestedDetail { postId: string; name: string }
interface PostDeleteRequestedDetail { postId: string }
interface SlotAddedDetail { postId: string; day: string; startTime: string; endTime: string }
interface SlotUpdatedDetail { postId: string; slotId: string; day: string; startTime: string; endTime: string }
interface SlotEditRequestedDetail { postId: string; slot: unknown }
interface SlotDeleteRequestedDetail { postId: string; slotId: string }
interface AssignSlotRequestedDetail { slotId: string; postId: string }
interface VolunteerAssignedDetail { volunteerId: string; slotId: string }
interface AssignmentDeleteRequestedDetail { assignmentId: string }

document.addEventListener('volunteer-created', (e) => {
  const event = (e as CustomEvent<VolunteerCreated>).detail
  ws.send('crew', 'CreateVolunteer', { name: event.payload.name }).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('volunteer-name-updated', (e) => {
  const detail = (e as CustomEvent<VolunteerNameUpdatedDetail>).detail
  ws.send('crew', 'UpdateVolunteerName', detail).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('volunteer-edit-name-requested', (e) => {
  if (editVolunteerNameForm) editVolunteerNameForm.open((e as CustomEvent<{ volunteerId: string; name: string }>).detail)
})

document.addEventListener('volunteer-delete-requested', (e) => {
  const detail = (e as CustomEvent<VolunteerDeleteRequestedDetail>).detail
  ws.send('crew', 'DeleteVolunteer', { volunteerId: detail.volunteerId }).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('post-created', (e) => {
  const event = (e as CustomEvent<PostCreated>).detail
  ws.send('crew', 'CreatePost', { name: event.payload.name, minVolunteers: event.payload.minVolunteers }).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('post-name-updated', (e) => {
  const detail = (e as CustomEvent<PostNameUpdatedDetail>).detail
  ws.send('crew', 'UpdatePostName', detail).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('post-edit-name-requested', (e) => {
  if (editPostNameForm) editPostNameForm.open((e as CustomEvent<PostEditNameRequestedDetail>).detail)
})

document.addEventListener('post-delete-requested', (e) => {
  const detail = (e as CustomEvent<PostDeleteRequestedDetail>).detail
  ws.send('crew', 'DeletePost', { postId: detail.postId }).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('slot-added', (e) => {
  const detail = (e as CustomEvent<SlotAddedDetail>).detail
  ws.send('crew', 'AddSlotToPost', detail).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('slot-updated', (e) => {
  const detail = (e as CustomEvent<SlotUpdatedDetail>).detail
  ws.send('crew', 'UpdateSlotInPost', detail).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('slot-edit-requested', (e) => {
  if (editSlotForm) editSlotForm.open((e as CustomEvent<SlotEditRequestedDetail>).detail)
})

document.addEventListener('slot-delete-requested', (e) => {
  const detail = (e as CustomEvent<SlotDeleteRequestedDetail>).detail
  ws.send('crew', 'RemoveSlotFromPost', { postId: detail.postId, slotId: detail.slotId }).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('assign-slot-requested', (e) => {
  if (assignForm) assignForm.selectSlot((e as CustomEvent<AssignSlotRequestedDetail>).detail)
})

document.addEventListener('volunteer-assigned', (e) => {
  const detail = (e as CustomEvent<VolunteerAssignedDetail>).detail
  ws.send('crew', 'AssignVolunteer', detail).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('assignment-delete-requested', (e) => {
  const detail = (e as CustomEvent<AssignmentDeleteRequestedDetail>).detail
  ws.send('crew', 'UnassignVolunteer', { assignmentId: detail.assignmentId }).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('crew-error', (e) => {
  const alert = document.getElementById('crew-alert')
  if (alert) {
    const detail = (e as CustomEvent<{ message: string }>).detail
    alert.textContent = detail.message
    alert.hidden = false
    setTimeout(() => { alert.hidden = true }, 4000)
  }
})
