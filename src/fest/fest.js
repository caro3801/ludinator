import { Activity } from './domain/model/Activity.js'
import { EntryLog } from './domain/model/EntryLog.js'
import { CreateActivity } from './application/usecases/CreateActivity.js'
import { UpdateActivityName } from './application/usecases/UpdateActivityName.js'
import { AddSlotToActivity } from './application/usecases/AddSlotToActivity.js'
import { RegisterToActivity } from './application/usecases/RegisterToActivity.js'
import { WsClient } from '../client/WsClient.js'
import './adapters/ui/FestActivityForm.js'
import './adapters/ui/FestActivityList.js'
import './adapters/ui/FestAddSlotForm.js'
import './adapters/ui/FestEntryForm.js'
import './adapters/ui/FestEntryCounter.js'
import './adapters/ui/FestAttendanceChart.js'
import './adapters/ui/FestProgrammeView.js'

const EDITION_ID = 'edition-2024'
const wsPort = 3000
const ws = new WsClient(`ws://${window.location.hostname}:${wsPort}`)

const activityForm = document.querySelector('fest-activity-form')
const activityList = document.querySelector('fest-activity-list')
const addSlotForm = document.querySelector('fest-add-slot-form')
const entryForm = document.querySelector('fest-entry-form')
const entryCounter = document.querySelector('fest-entry-counter')
const attendanceChart = document.querySelector('fest-attendance-chart')
const programmeView = document.querySelector('fest-programme-view')
const offlineBanner = document.getElementById('offline-banner')

let currentActivities = []

activityForm.createActivityUseCase = {
  execute: ({ name, location = null }) => {
    new CreateActivity().execute({ name, location })
    return ws.send('fest', 'CreateActivity', { name, location })
  },
}

addSlotForm.addSlotToActivityUseCase = {
  execute: ({ activityId, day, startTime, endTime, min = null, max = null }) => {
    const activity = currentActivities.find(a => a.id === activityId)
    if (activity) new AddSlotToActivity().execute({ activity, day, startTime, endTime, min, max })
    return ws.send('fest', 'AddSlotToActivity', { activityId, day, startTime, endTime, min, max })
  },
}

entryForm.registerEntryUseCase = {
  execute: ({ activityId, slotId, personName }) => {
    const activity = currentActivities.find(a => a.id === activityId)
    if (!activity) throw new Error(`Activity not found: ${activityId}`)
    const event = new RegisterToActivity().execute({ activity, slotId, personName })
    ws.send('fest', 'RegisterToActivity', { activityId, slotId, personName })
    const slot = event.payload.slots.find(s => s.id === slotId)
    return slot.registrations[slot.registrations.length - 1]
  },
}

entryForm.cancelRegistrationUseCase = {
  execute: ({ activityId, slotId, registrationId }) =>
    ws.send('fest', 'CancelRegistration', { activityId, slotId, registrationId }),
}

entryCounter.editionId = EDITION_ID
entryCounter.addSubCounterUseCase = {
  execute: ({ label }) => ws.send('fest', 'AddSubCounter', { label }),
}
entryCounter.removeSubCounterUseCase = {
  execute: ({ subCounterId }) => ws.send('fest', 'RemoveSubCounter', { subCounterId }),
}
entryCounter.recordSubCounterEntriesUseCase = {
  execute: ({ subCounterId, adults, children, families }) =>
    ws.send('fest', 'RecordSubCounterEntries', { subCounterId, adults, children, families }),
}
entryCounter.updateSubCounterBatchUseCase = {
  execute: ({ subCounterId, batchId, adults, children, families }) =>
    ws.send('fest', 'UpdateSubCounterBatch', { subCounterId, batchId, adults, children, families }),
}
entryCounter.deleteSubCounterBatchUseCase = {
  execute: ({ subCounterId, batchId }) =>
    ws.send('fest', 'DeleteSubCounterBatch', { subCounterId, batchId }),
}

ws.onState('fest', ({ activities, entryLog }) => {
  const domainActivities = activities.map(a => Activity.fromJSON(a))
  const domainEntryLog = entryLog ? EntryLog.fromJSON(entryLog) : null
  currentActivities = domainActivities

  activityList.refresh({ findAll: () => Promise.resolve(domainActivities) })
  addSlotForm.activities = domainActivities
  programmeView.refresh({ findAll: () => Promise.resolve(domainActivities) })
  entryCounter.refresh(domainEntryLog)
  attendanceChart.refresh(domainEntryLog)
})

ws.onConnectionChange(({ connected, queueLength }) => {
  offlineBanner.hidden = connected
  offlineBanner.textContent = `Hors ligne — ${queueLength} action(s) en attente`
})

const showError = msg => document.dispatchEvent(new CustomEvent('fest-error', { detail: { message: msg } }))

document.addEventListener('activity-rename-requested', e => {
  const name = prompt('Nouveau nom :', e.detail.name)
  if (!name) return
  const activity = currentActivities.find(a => a.id === e.detail.activityId)
  try {
    if (activity) new UpdateActivityName().execute({ activity, name })
  } catch (err) {
    showError(err.message)
    return
  }
  ws.send('fest', 'UpdateActivityName', { activityId: e.detail.activityId, name }).catch(err => showError(err.message))
})

document.addEventListener('activity-delete-requested', e =>
  ws.send('fest', 'DeleteActivity', { activityId: e.detail.activityId }).catch(err => showError(err.message)))

document.addEventListener('add-entry-requested', e =>
  entryForm.open({ activityId: e.detail.activityId, slotId: e.detail.slotId, registrations: e.detail.registrations }))

document.addEventListener('fest-error', e => {
  const alert = document.getElementById('fest-alert')
  alert.textContent = e.detail.message
  alert.hidden = false
  setTimeout(() => { alert.hidden = true }, 4000)
})
