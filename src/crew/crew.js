import { Volunteer } from './domain/model/Volunteer.js'
import { Post } from './domain/model/Post.js'
import { Schedule } from './domain/model/Schedule.js'
import { CreateVolunteer } from './application/usecases/CreateVolunteer.js'
import { UpdateVolunteerName } from './application/usecases/UpdateVolunteerName.js'
import { CreatePost } from './application/usecases/CreatePost.js'
import { UpdatePostName } from './application/usecases/UpdatePostName.js'
import { AddSlotToPost } from './application/usecases/AddSlotToPost.js'
import { UpdateSlotInPost } from './application/usecases/UpdateSlotInPost.js'
import { WsClient } from '../client/WsClient.js'
import './adapters/ui/CrewVolunteerForm.js'
import './adapters/ui/CrewVolunteerList.js'
import './adapters/ui/CrewEditVolunteerNameForm.js'
import './adapters/ui/CrewPostForm.js'
import './adapters/ui/CrewPostList.js'
import './adapters/ui/CrewAddSlotForm.js'
import './adapters/ui/CrewEditSlotForm.js'
import './adapters/ui/CrewEditPostNameForm.js'
import './adapters/ui/CrewAssignForm.js'
import './adapters/ui/CrewPlanningView.js'
import './adapters/ui/CrewStatsView.js'

const EDITION_ID = 'edition-2024'
const wsPort = 3000
const ws = new WsClient(`ws://${window.location.hostname}:${wsPort}`)

const volunteerForm = document.querySelector('crew-volunteer-form')
const volunteerList = document.querySelector('crew-volunteer-list')
const editVolunteerNameForm = document.querySelector('crew-edit-volunteer-name-form')
const postForm = document.querySelector('crew-post-form')
const postList = document.querySelector('crew-post-list')
const addSlotForm = document.querySelector('crew-add-slot-form')
const editSlotForm = document.querySelector('crew-edit-slot-form')
const editPostNameForm = document.querySelector('crew-edit-post-name-form')
const assignForm = document.querySelector('crew-assign-form')
const planningView = document.querySelector('crew-planning-view')
const statsView = document.querySelector('crew-stats-view')
const offlineBanner = document.getElementById('offline-banner')

volunteerForm.createVolunteerUseCase = {
  execute: ({ name }) => {
    new CreateVolunteer().execute({ name })
    return { name }
  },
}

editVolunteerNameForm.updateVolunteerNameUseCase = {
  execute: ({ volunteerId, name }) => {
    new UpdateVolunteerName().execute({ volunteer: { id: volunteerId, name: 'x' }, name })
    return { volunteerId, name }
  },
}

postForm.createPostUseCase = {
  execute: ({ name, minVolunteers }) => {
    new CreatePost().execute({ name, minVolunteers })
    return { name, minVolunteers }
  },
}

editPostNameForm.updatePostNameUseCase = {
  execute: ({ postId, name }) => {
    new UpdatePostName().execute({ post: { id: postId, name: 'x', minVolunteers: 1, slots: [] }, name })
    return { postId, name }
  },
}

addSlotForm.addSlotToPostUseCase = {
  execute: ({ postId, day, startTime, endTime }) => {
    new AddSlotToPost().execute({ post: { id: postId, name: 'x', minVolunteers: 1, slots: [] }, day, startTime, endTime })
    return { postId, day, startTime, endTime }
  },
}

editSlotForm.updateSlotInPostUseCase = {
  execute: ({ postId, slotId, day, startTime, endTime }) => {
    return { postId, slotId, day, startTime, endTime }
  },
}

assignForm.editionId = EDITION_ID
assignForm.assignVolunteerUseCase = {
  execute: ({ volunteerId, slotId }) => ({ volunteerId, slotId }),
}

ws.onState('crew', ({ volunteers, posts, schedule }) => {
  const domainVolunteers = volunteers.map(v => Volunteer.fromJSON(v))
  const domainPosts = posts.map(p => Post.fromJSON(p))
  const domainSchedule = schedule ? Schedule.fromJSON(schedule) : null

  volunteerList.refresh({ findAll: () => Promise.resolve(domainVolunteers) })
  postList.refresh({ findAll: () => Promise.resolve(domainPosts) })
  addSlotForm.posts = domainPosts
  assignForm.volunteers = domainVolunteers
  assignForm.posts = domainPosts

  planningView.refresh({
    scheduleRepo: { findByEdition: () => Promise.resolve(domainSchedule) },
    volunteerRepo: { findAll: () => Promise.resolve(domainVolunteers) },
    postRepo: { findAll: () => Promise.resolve(domainPosts) },
  }, EDITION_ID)

  statsView.refresh({
    scheduleRepo: { findByEdition: () => Promise.resolve(domainSchedule) },
    volunteerRepo: { findAll: () => Promise.resolve(domainVolunteers) },
  }, EDITION_ID)
})

ws.onConnectionChange(({ connected, queueLength }) => {
  offlineBanner.hidden = connected
  offlineBanner.textContent = `Hors ligne — ${queueLength} action(s) en attente`
})

const dispatchError = msg => document.dispatchEvent(new CustomEvent('crew-error', { detail: { message: msg } }))

document.addEventListener('volunteer-created', e =>
  ws.send('crew', 'CreateVolunteer', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('volunteer-name-updated', e =>
  ws.send('crew', 'UpdateVolunteerName', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('volunteer-edit-name-requested', e => editVolunteerNameForm.open(e.detail))

document.addEventListener('volunteer-delete-requested', e =>
  ws.send('crew', 'DeleteVolunteer', { volunteerId: e.detail.volunteerId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('post-created', e =>
  ws.send('crew', 'CreatePost', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('post-name-updated', e =>
  ws.send('crew', 'UpdatePostName', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('post-edit-name-requested', e => editPostNameForm.open(e.detail))

document.addEventListener('post-delete-requested', e =>
  ws.send('crew', 'DeletePost', { postId: e.detail.postId }).catch(err => dispatchError(err.message)))

document.addEventListener('slot-added', e =>
  ws.send('crew', 'AddSlotToPost', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('slot-updated', e =>
  ws.send('crew', 'UpdateSlotInPost', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('slot-edit-requested', e => editSlotForm.open(e.detail))

document.addEventListener('slot-delete-requested', e =>
  ws.send('crew', 'RemoveSlotFromPost', { postId: e.detail.postId, slotId: e.detail.slotId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('assign-slot-requested', e => assignForm.selectSlot(e.detail))

document.addEventListener('volunteer-assigned', e =>
  ws.send('crew', 'AssignVolunteer', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('assignment-delete-requested', e =>
  ws.send('crew', 'UnassignVolunteer', { assignmentId: e.detail.assignmentId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('crew-error', e => {
  const alert = document.getElementById('crew-alert')
  alert.textContent = e.detail.message
  alert.hidden = false
  setTimeout(() => { alert.hidden = true }, 4000)
})
