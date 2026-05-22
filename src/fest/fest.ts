import { Activity } from './domain/model/Activity'
import { EntryLog } from './domain/model/EntryLog'
import { CreateActivity } from './application/usecases/CreateActivity'
import { UpdateActivityName } from './application/usecases/UpdateActivityName'
import { AddSlotToActivity } from './application/usecases/AddSlotToActivity'
import { RegisterToActivity } from './application/usecases/RegisterToActivity'
import { ActivityJSON } from './domain/model/Activity'
import { WsClient } from '../client/WsClient'
import './adapters/ui/FestActivityForm'
import './adapters/ui/FestActivityList'
import './adapters/ui/FestAddSlotForm'
import './adapters/ui/FestEntryForm'
import './adapters/ui/FestEntryCounter'
import './adapters/ui/FestAttendanceChart'
import './adapters/ui/FestProgrammeView'

const EDITION_ID = 'edition-2024'
const wsPort = 3000
const ws = new WsClient(`ws://${window.location.hostname}:${wsPort}`)

const activityForm = document.querySelector<HTMLElement & { createActivityUseCase: unknown }>('fest-activity-form')
const activityList = document.querySelector<HTMLElement & { refresh: (repo: unknown) => Promise<void> }>('fest-activity-list')
const addSlotForm = document.querySelector<HTMLElement & { activities: unknown; addSlotToActivityUseCase: unknown }>('fest-add-slot-form')
const entryForm = document.querySelector<HTMLElement & { open: (params: unknown) => void; registerEntryUseCase: unknown; cancelRegistrationUseCase: unknown }>('fest-entry-form')
const entryCounter = document.querySelector<HTMLElement & { editionId: string; refresh: (log: unknown) => void; addSubCounterUseCase: unknown; removeSubCounterUseCase: unknown; recordSubCounterEntriesUseCase: unknown; updateSubCounterBatchUseCase: unknown; deleteSubCounterBatchUseCase: unknown }>('fest-entry-counter')
const attendanceChart = document.querySelector<HTMLElement & { refresh: (log: unknown) => void }>('fest-attendance-chart')
const programmeView = document.querySelector<HTMLElement & { refresh: (repo: unknown, opts?: unknown) => Promise<void> }>('fest-programme-view')
const offlineBanner = document.getElementById('offline-banner')

let currentActivities: Activity[] = []

if (activityForm) {
  activityForm.createActivityUseCase = {
    execute: async ({ name, location = null }: { name: string; location?: string | null }): Promise<unknown> => {
      new CreateActivity().execute({ name, location })
      return ws.send('fest', 'CreateActivity', { name, location })
    },
  }
}

if (addSlotForm) {
  addSlotForm.addSlotToActivityUseCase = {
    execute: async ({ activityId, day, startTime, endTime, min = null, max = null }: { activityId: string; day: string; startTime: string; endTime: string; min?: number | null; max?: number | null }): Promise<unknown> => {
      const activity = currentActivities.find((a) => a.id === activityId)
      if (activity) new AddSlotToActivity().execute({ activity: activity.toJSON(), day, startTime, endTime, min, max })
      return ws.send('fest', 'AddSlotToActivity', { activityId, day, startTime, endTime, min, max })
    },
  }
}

if (entryForm) {
  entryForm.registerEntryUseCase = {
    execute: async ({ activityId, slotId, personName }: { activityId: string; slotId: string; personName: string }): Promise<unknown> => {
      const activity = currentActivities.find((a) => a.id === activityId)
      if (!activity) throw new Error(`Activity not found: ${activityId}`)
      const event = new RegisterToActivity().execute({ activity: activity.toJSON(), slotId, personName })
      ws.send('fest', 'RegisterToActivity', { activityId, slotId, personName })
      const slot = (event.payload as ActivityJSON).slots.find((s) => s.id === slotId)
      return slot?.registrations[slot.registrations.length - 1]
    },
  }

  entryForm.cancelRegistrationUseCase = {
    execute: async ({ activityId, slotId, registrationId }: { activityId: string; slotId: string; registrationId: string }): Promise<unknown> =>
      ws.send('fest', 'CancelRegistration', { activityId, slotId, registrationId }),
  }
}

if (entryCounter) {
  entryCounter.editionId = EDITION_ID
  entryCounter.addSubCounterUseCase = {
    execute: async ({ label }: { label: string }): Promise<unknown> =>
      ws.send('fest', 'AddSubCounter', { label }),
  }
  entryCounter.removeSubCounterUseCase = {
    execute: async ({ subCounterId }: { subCounterId: string }): Promise<unknown> =>
      ws.send('fest', 'RemoveSubCounter', { subCounterId }),
  }
  entryCounter.recordSubCounterEntriesUseCase = {
    execute: async ({ subCounterId, adults, children, families }: { subCounterId: string; adults: number; children: number; families: number }): Promise<unknown> =>
      ws.send('fest', 'RecordSubCounterEntries', { subCounterId, adults, children, families }),
  }
  entryCounter.updateSubCounterBatchUseCase = {
    execute: async ({ subCounterId, batchId, adults, children, families }: { subCounterId: string; batchId: string; adults: number; children: number; families: number }): Promise<unknown> =>
      ws.send('fest', 'UpdateSubCounterBatch', { subCounterId, batchId, adults, children, families }),
  }
  entryCounter.deleteSubCounterBatchUseCase = {
    execute: async ({ subCounterId, batchId }: { subCounterId: string; batchId: string }): Promise<unknown> =>
      ws.send('fest', 'DeleteSubCounterBatch', { subCounterId, batchId }),
  }
}

ws.onState('fest', ({ activities, entryLog }: { activities: ActivityJSON[]; entryLog: unknown | null }) => {
  const domainActivities = activities.map((a) => Activity.fromJSON(a))
  const domainEntryLog = entryLog ? EntryLog.fromJSON(entryLog) : null
  currentActivities = domainActivities

  if (activityList) {
    activityList.refresh({ findAll: () => Promise.resolve(domainActivities) })
  }
  if (addSlotForm) {
    addSlotForm.activities = domainActivities.map((a) => a.toJSON())
  }
  if (programmeView) {
    programmeView.refresh({ findAll: () => Promise.resolve(domainActivities) })
  }
  if (entryCounter) {
    entryCounter.refresh(domainEntryLog)
  }
  if (attendanceChart) {
    attendanceChart.refresh(domainEntryLog)
  }
})

ws.onConnectionChange(({ connected, queueLength }: { connected: boolean; queueLength: number }) => {
  if (offlineBanner) {
    offlineBanner.hidden = connected
    offlineBanner.textContent = `Hors ligne — ${queueLength} action(s) en attente`
  }
})

const showError = (msg: string): void => document.dispatchEvent(new CustomEvent('fest-error', { detail: { message: msg } }))

document.addEventListener('activity-rename-requested', (e) => {
  const event = e as CustomEvent<{ activityId: string; name: string }>
  const name = prompt('Nouveau nom :', event.detail.name)
  if (!name) return
  const activity = currentActivities.find((a) => a.id === event.detail.activityId)
  try {
    if (activity) new UpdateActivityName().execute({ activity: activity.toJSON(), name })
  } catch (err) {
    showError((err as Error).message)
    return
  }
  ws.send('fest', 'UpdateActivityName', { activityId: event.detail.activityId, name }).catch((err: Error) => showError(err.message))
})

document.addEventListener('activity-delete-requested', (e) => {
  const event = e as CustomEvent<{ activityId: string }>
  ws.send('fest', 'DeleteActivity', { activityId: event.detail.activityId }).catch((err: Error) => showError(err.message))
})

document.addEventListener('add-entry-requested', (e) => {
  const event = e as CustomEvent<{ activityId: string; slotId: string; registrations: unknown[] }>
  if (entryForm) {
    entryForm.open({ activityId: event.detail.activityId, slotId: event.detail.slotId, registrations: event.detail.registrations })
  }
})

document.addEventListener('fest-error', (e) => {
  const event = e as CustomEvent<{ message: string }>
  const alert = document.getElementById('fest-alert')
  if (alert) {
    alert.textContent = event.detail.message
    alert.hidden = false
    setTimeout(() => { alert.hidden = true }, 4000)
  }
})
