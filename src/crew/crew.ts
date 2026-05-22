import { Volunteer } from './domain/model/Volunteer'
import { Post } from './domain/model/Post'
import { Schedule } from './domain/model/Schedule'
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

// Import all UI components to register them
import './adapters/ui/CrewVolunteerForm.ts'
import './adapters/ui/CrewVolunteerList.ts'
import './adapters/ui/CrewEditVolunteerNameForm.ts'
import './adapters/ui/CrewPostForm.ts'
import './adapters/ui/CrewPostList.ts'
import './adapters/ui/CrewAddSlotForm.ts'
import './adapters/ui/CrewEditSlotForm.ts'
import './adapters/ui/CrewEditPostNameForm.ts'
import './adapters/ui/CrewAssignForm.ts'
import './adapters/ui/CrewPlanningView.ts'
import './adapters/ui/CrewStatsView.ts'
import './adapters/ui/CrewScheduleView.ts'
import './adapters/ui/CrewVolunteerPlanningView.ts'

const EDITION_ID = 'edition-2024'
const wsPort = 3000
const ws = new WsClient(`ws://${window.location.hostname}:${wsPort}`)

// Get DOM elements with proper typing
const volunteerForm = document.querySelector<HTMLElement & { createVolunteerUseCase: unknown }>('crew-volunteer-form')
const volunteerList = document.querySelector<HTMLElement & { refresh: unknown }>('crew-volunteer-list')
const editVolunteerNameForm = document.querySelector<HTMLElement & { updateVolunteerNameUseCase: unknown; open: (detail: unknown) => void }>('crew-edit-volunteer-name-form')
const postForm = document.querySelector<HTMLElement & { createPostUseCase: unknown }>('crew-post-form')
const postList = document.querySelector<HTMLElement & { refresh: unknown }>('crew-post-list')
const addSlotForm = document.querySelector<HTMLElement & { addSlotToPostUseCase: unknown; posts: unknown }>('crew-add-slot-form')
const editSlotForm = document.querySelector<HTMLElement & { updateSlotInPostUseCase: unknown; open: (detail: unknown) => void }>('crew-edit-slot-form')
const editPostNameForm = document.querySelector<HTMLElement & { updatePostNameUseCase: unknown; open: (detail: unknown) => void }>('crew-edit-post-name-form')
const assignForm = document.querySelector<HTMLElement & { editionId: string; assignVolunteerUseCase: unknown; volunteers: unknown; posts: unknown; selectSlot: (detail: unknown) => void }>('crew-assign-form')
const planningView = document.querySelector<HTMLElement & { refresh: unknown }>('crew-planning-view')
const statsView = document.querySelector<HTMLElement & { refresh: unknown }>('crew-stats-view')
const offlineBanner = document.getElementById('offline-banner')

const dispatchError = (msg: string): void => {
  document.dispatchEvent(new CustomEvent('crew-error', { detail: { message: msg } }))
}

// Configure use cases
if (volunteerForm) {
  volunteerForm.createVolunteerUseCase = {
    execute: ({ name }: { name: string }) => {
      new CreateVolunteer().execute({ name })
      return { name }
    },
  }
}

if (editVolunteerNameForm) {
  editVolunteerNameForm.updateVolunteerNameUseCase = {
    execute: ({ volunteerId, name }: { volunteerId: string; name: string }) => {
      new UpdateVolunteerName().execute({ volunteer: { id: volunteerId, name: 'x' }, name })
      return { volunteerId, name }
    },
  }
}

if (postForm) {
  postForm.createPostUseCase = {
    execute: ({ name, minVolunteers }: { name: string; minVolunteers: number }) => {
      new CreatePost().execute({ name, minVolunteers })
      return { name, minVolunteers }
    },
  }
}

if (editPostNameForm) {
  editPostNameForm.updatePostNameUseCase = {
    execute: ({ postId, name }: { postId: string; name: string }) => {
      new UpdatePostName().execute({ post: { id: postId, name: 'x', minVolunteers: 1, slots: [] }, name })
      return { postId, name }
    },
  }
}

if (addSlotForm) {
  addSlotForm.addSlotToPostUseCase = {
    execute: ({ postId, day, startTime, endTime }: { postId: string; day: string; startTime: string; endTime: string }) => {
      new AddSlotToPost().execute({ post: { id: postId, name: 'x', minVolunteers: 1, slots: [] }, day, startTime, endTime })
      return { postId, day, startTime, endTime }
    },
  }
}

if (editSlotForm) {
  editSlotForm.updateSlotInPostUseCase = {
    execute: ({ postId, slotId, day, startTime, endTime }: { postId: string; slotId: string; day: string; startTime: string; endTime: string }) => {
      new UpdateSlotInPost().execute({ post: { id: postId, name: 'x', minVolunteers: 1, slots: [] }, slotId, day, startTime, endTime })
      return { postId, slotId, day, startTime, endTime }
    },
  }
}

if (assignForm) {
  assignForm.editionId = EDITION_ID
  assignForm.assignVolunteerUseCase = {
    execute: ({ volunteerId, slotId }: { volunteerId: string; slotId: string }) => {
      new AssignVolunteer().execute({ volunteer: { id: volunteerId, name: 'x' }, slot: { id: slotId, postId: 'x', window: { day: 'x', startTime: '00:00', endTime: '01:00' } }, schedule: null, editionId: EDITION_ID })
      return { volunteerId, slotId }
    },
  }
}

// Handle state updates from WebSocket
ws.onState('crew', ({ volunteers, posts, schedule }: { volunteers: unknown[]; posts: unknown[]; schedule: unknown | null }) => {
  const domainVolunteers = volunteers.map((v: unknown) => Volunteer.fromJSON(v as { id: string; name: string }))
  const domainPosts = posts.map((p: unknown) => Post.fromJSON(p as { id: string; name: string; minVolunteers: number; slots: unknown[] }))
  const domainSchedule = schedule ? Schedule.fromJSON(schedule as { id: string; editionId: string; assignments: unknown[] }) : null

  if (volunteerList) {
    volunteerList.refresh({ findAll: () => Promise.resolve(domainVolunteers) })
  }
  if (postList) {
    postList.refresh({ findAll: () => Promise.resolve(domainPosts) })
  }
  if (addSlotForm) {
    addSlotForm.posts = domainPosts
  }
  if (assignForm) {
    assignForm.volunteers = domainVolunteers
    assignForm.posts = domainPosts
  }

  if (planningView) {
    planningView.refresh({
      scheduleRepo: { findByEdition: () => Promise.resolve(domainSchedule) },
      volunteerRepo: { findAll: () => Promise.resolve(domainVolunteers) },
      postRepo: { findAll: () => Promise.resolve(domainPosts) },
    }, EDITION_ID)
  }

  if (statsView) {
    statsView.refresh({
      scheduleRepo: { findByEdition: () => Promise.resolve(domainSchedule) },
      volunteerRepo: { findAll: () => Promise.resolve(domainVolunteers) },
    }, EDITION_ID)
  }
})

ws.onConnectionChange(({ connected, queueLength }: { connected: boolean; queueLength: number }) => {
  if (offlineBanner) {
    offlineBanner.hidden = connected
    offlineBanner.textContent = `Hors ligne — ${queueLength} action(s) en attente`
  }
})

// Event listeners for domain events
interface VolunteerCreatedDetail { name: string }
interface VolunteerNameUpdatedDetail { volunteerId: string; name: string }
interface VolunteerDeleteRequestedDetail { volunteerId: string }
interface PostCreatedDetail { name: string; minVolunteers: number }
interface PostNameUpdatedDetail { postId: string; name: string }
interface PostEditNameRequestedDetail { postId: string; name: string }
interface PostDeleteRequestedDetail { postId: string }
interface SlotAddedDetail { postId: string; day: string; startTime: string; endTime: string }
interface SlotUpdatedDetail { postId: string; slotId: string; day: string; startTime: string; endTime: string }
interface SlotEditRequestedDetail { postId: string; slot: unknown }
interface SlotDeleteRequestedDetail { postId: string; slotId: string }
interface AssignSlotRequestedDetail { slotId: string; postId: string }
interface VolunteerAssignedDetail { volunteer: unknown; slot: unknown; schedule: unknown; editionId: string }
interface AssignmentDeleteRequestedDetail { assignmentId: string }

document.addEventListener('volunteer-created', (e) => {
  const detail = (e as CustomEvent<VolunteerCreatedDetail>).detail
  ws.send('crew', 'CreateVolunteer', detail).catch((err) => dispatchError((err as Error).message))
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
  const detail = (e as CustomEvent<PostCreatedDetail>).detail
  ws.send('crew', 'CreatePost', detail).catch((err) => dispatchError((err as Error).message))
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
