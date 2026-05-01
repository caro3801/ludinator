import { LocalStorageActivityRepository } from './adapters/storage/LocalStorageActivityRepository.js'
import { LocalStorageEntryLogRepository } from './adapters/storage/LocalStorageEntryLogRepository.js'
import { CreateActivity } from './application/usecases/CreateActivity.js'
import { UpdateActivityName } from './application/usecases/UpdateActivityName.js'
import { DeleteActivity } from './application/usecases/DeleteActivity.js'
import { AddSlotToActivity } from './application/usecases/AddSlotToActivity.js'
import { RegisterToActivity } from './application/usecases/RegisterToActivity.js'
import { CancelRegistration } from './application/usecases/CancelRegistration.js'
import { AddSubCounter } from './application/usecases/AddSubCounter.js'
import { RemoveSubCounter } from './application/usecases/RemoveSubCounter.js'
import { RecordSubCounterEntries } from './application/usecases/RecordSubCounterEntries.js'
import { UpdateSubCounterBatch } from './application/usecases/UpdateSubCounterBatch.js'
import { DeleteSubCounterBatch } from './application/usecases/DeleteSubCounterBatch.js'
import './adapters/ui/FestActivityForm.js'
import './adapters/ui/FestActivityList.js'
import './adapters/ui/FestAddSlotForm.js'
import './adapters/ui/FestEntryForm.js'
import './adapters/ui/FestEntryCounter.js'
import './adapters/ui/FestAttendanceChart.js'
import './adapters/ui/FestProgrammeView.js'

const EDITION_ID = 'edition-2024'

const activityRepo = new LocalStorageActivityRepository()
const entryLogRepo = new LocalStorageEntryLogRepository()

const activityForm = document.querySelector('fest-activity-form')
const activityList = document.querySelector('fest-activity-list')
const addSlotForm = document.querySelector('fest-add-slot-form')
const entryForm = document.querySelector('fest-entry-form')
const entryCounter = document.querySelector('fest-entry-counter')
const attendanceChart = document.querySelector('fest-attendance-chart')
const programmeView = document.querySelector('fest-programme-view')

activityForm.createActivityUseCase = new CreateActivity(activityRepo)
addSlotForm.addSlotToActivityUseCase = new AddSlotToActivity(activityRepo)
entryForm.registerEntryUseCase = new RegisterToActivity(activityRepo)
entryForm.cancelRegistrationUseCase = new CancelRegistration(activityRepo)
entryCounter.addSubCounterUseCase = new AddSubCounter(entryLogRepo)
entryCounter.removeSubCounterUseCase = new RemoveSubCounter(entryLogRepo)
entryCounter.recordSubCounterEntriesUseCase = new RecordSubCounterEntries(entryLogRepo)
entryCounter.updateSubCounterBatchUseCase = new UpdateSubCounterBatch(entryLogRepo)
entryCounter.deleteSubCounterBatchUseCase = new DeleteSubCounterBatch(entryLogRepo)
entryCounter.editionId = EDITION_ID

const refreshActivities = async () => {
  const activities = await activityRepo.findAll()
  activityList.refresh(activityRepo)
  addSlotForm.activities = activities
  programmeView.refresh(activityRepo)
}

const refreshEntries = async () => {
  const log = await entryLogRepo.findByEdition(EDITION_ID)
  entryCounter.refresh(log)
  attendanceChart.refresh(log)
}

refreshActivities()
refreshEntries()

document.addEventListener('activity-created', refreshActivities)
document.addEventListener('slot-added-to-activity', refreshActivities)
document.addEventListener('entry-registered', refreshActivities)
document.addEventListener('entries-updated', refreshEntries)

document.addEventListener('activity-rename-requested', e => {
  const name = prompt('Nouveau nom :', e.detail.name)
  if (!name) return
  new UpdateActivityName(activityRepo).execute({ activityId: e.detail.activityId, name })
    .then(refreshActivities)
    .catch(err => showError(err.message))
})

document.addEventListener('activity-delete-requested', async e => {
  await new DeleteActivity(activityRepo).execute({ activityId: e.detail.activityId })
  refreshActivities()
})

document.addEventListener('add-entry-requested', e => {
  entryForm.open({ activityId: e.detail.activityId, slotId: e.detail.slotId, registrations: e.detail.registrations })
})

document.addEventListener('registration-cancelled', refreshActivities)

document.addEventListener('fest-error', e => {
  const alert = document.getElementById('fest-alert')
  alert.textContent = e.detail.message
  alert.hidden = false
  setTimeout(() => { alert.hidden = true }, 4000)
})

function showError(message) {
  document.dispatchEvent(new CustomEvent('fest-error', { detail: { message } }))
}
