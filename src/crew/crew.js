import { LocalStorageVolunteerRepository } from './adapters/storage/LocalStorageVolunteerRepository.js'
import { LocalStoragePostRepository } from './adapters/storage/LocalStoragePostRepository.js'
import { LocalStorageScheduleRepository } from './adapters/storage/LocalStorageScheduleRepository.js'
import { CreateVolunteer } from './application/usecases/CreateVolunteer.js'
import { UpdateVolunteerName } from './application/usecases/UpdateVolunteerName.js'
import { DeleteVolunteer } from './application/usecases/DeleteVolunteer.js'
import { CreatePost } from './application/usecases/CreatePost.js'
import { UpdatePostName } from './application/usecases/UpdatePostName.js'
import { DeletePost } from './application/usecases/DeletePost.js'
import { AddSlotToPost } from './application/usecases/AddSlotToPost.js'
import { RemoveSlotFromPost } from './application/usecases/RemoveSlotFromPost.js'
import { UpdateSlotInPost } from './application/usecases/UpdateSlotInPost.js'
import { AssignVolunteer } from './application/usecases/AssignVolunteer.js'
import { UnassignVolunteer } from './application/usecases/UnassignVolunteer.js'
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

const volunteerRepo = new LocalStorageVolunteerRepository()
const postRepo = new LocalStoragePostRepository()
const scheduleRepo = new LocalStorageScheduleRepository()

const createVolunteer = new CreateVolunteer(volunteerRepo)
const updateVolunteerName = new UpdateVolunteerName(volunteerRepo)
const deleteVolunteer = new DeleteVolunteer(volunteerRepo, scheduleRepo)
const createPost = new CreatePost(postRepo)
const updatePostName = new UpdatePostName(postRepo)
const deletePost = new DeletePost(postRepo, scheduleRepo)
const addSlotToPost = new AddSlotToPost(postRepo)
const removeSlotFromPost = new RemoveSlotFromPost(postRepo, scheduleRepo)
const updateSlotInPost = new UpdateSlotInPost(postRepo)
const assignVolunteer = new AssignVolunteer(volunteerRepo, postRepo, scheduleRepo)
const unassignVolunteer = new UnassignVolunteer(scheduleRepo)

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

volunteerForm.createVolunteerUseCase = createVolunteer
editVolunteerNameForm.updateVolunteerNameUseCase = updateVolunteerName
postForm.createPostUseCase = createPost
editPostNameForm.updatePostNameUseCase = updatePostName
addSlotForm.addSlotToPostUseCase = addSlotToPost
editSlotForm.updateSlotInPostUseCase = updateSlotInPost
assignForm.assignVolunteerUseCase = assignVolunteer
assignForm.editionId = EDITION_ID

const refreshAll = async () => {
  const [volunteers, posts] = await Promise.all([
    volunteerRepo.findAll(),
    postRepo.findAll(),
  ])
  volunteerList.refresh(volunteerRepo)
  postList.refresh(postRepo)
  addSlotForm.posts = posts
  assignForm.volunteers = volunteers
  assignForm.posts = posts
  planningView.refresh({ scheduleRepo, volunteerRepo, postRepo }, EDITION_ID)
  statsView.refresh({ scheduleRepo, volunteerRepo }, EDITION_ID)
}

refreshAll()

document.addEventListener('volunteer-created', refreshAll)
document.addEventListener('volunteer-name-updated', refreshAll)
document.addEventListener('post-created', refreshAll)
document.addEventListener('post-name-updated', refreshAll)
document.addEventListener('slot-added', refreshAll)
document.addEventListener('slot-updated', refreshAll)
document.addEventListener('volunteer-assigned', refreshAll)

document.addEventListener('volunteer-edit-name-requested', e => editVolunteerNameForm.open(e.detail))
document.addEventListener('volunteer-delete-requested', async e => {
  await deleteVolunteer.execute({ volunteerId: e.detail.volunteerId, editionId: EDITION_ID })
  refreshAll()
})

document.addEventListener('slot-delete-requested', async e => {
  await removeSlotFromPost.execute({ ...e.detail, editionId: EDITION_ID })
  refreshAll()
})
document.addEventListener('slot-edit-requested', e => editSlotForm.open(e.detail))

document.addEventListener('post-delete-requested', async e => {
  await deletePost.execute({ postId: e.detail.postId, editionId: EDITION_ID })
  refreshAll()
})
document.addEventListener('post-edit-name-requested', e => editPostNameForm.open(e.detail))

document.addEventListener('assign-slot-requested', e => assignForm.selectSlot(e.detail))

document.addEventListener('assignment-delete-requested', async e => {
  await unassignVolunteer.execute({ assignmentId: e.detail.assignmentId, editionId: EDITION_ID })
  refreshAll()
})

document.addEventListener('crew-error', e => {
  const alert = document.getElementById('crew-alert')
  alert.textContent = e.detail.message
  alert.hidden = false
  setTimeout(() => { alert.hidden = true }, 4000)
})
