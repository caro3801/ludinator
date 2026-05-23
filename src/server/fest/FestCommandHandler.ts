import { CreateActivity } from '../../fest/application/usecases/CreateActivity'
import { UpdateActivityName } from '../../fest/application/usecases/UpdateActivityName'
import { DeleteActivity } from '../../fest/application/usecases/DeleteActivity'
import { AddSlotToActivity } from '../../fest/application/usecases/AddSlotToActivity'
import { RegisterToActivity } from '../../fest/application/usecases/RegisterToActivity'
import { CancelRegistration } from '../../fest/application/usecases/CancelRegistration'
import { UpdateRegistration } from '../../fest/application/usecases/UpdateRegistration'
import { AddSubCounter } from '../../fest/application/usecases/AddSubCounter'
import { RemoveSubCounter } from '../../fest/application/usecases/RemoveSubCounter'
import { RecordSubCounterEntries } from '../../fest/application/usecases/RecordSubCounterEntries'
import { UpdateSubCounterBatch } from '../../fest/application/usecases/UpdateSubCounterBatch'
import { DeleteSubCounterBatch } from '../../fest/application/usecases/DeleteSubCounterBatch'
import { FestProjection } from './FestProjection'
import { ActivityId, FestSlotId, EntryId, RegistrationId, EditionId } from '../../shared/types'

const EDITION_ID: EditionId = 'edition-2024'

interface TimeWindow {
  day: string
  startTime: string
  endTime: string
}

interface Slot {
  id: FestSlotId
  activityId: ActivityId
  window: TimeWindow
  min: number | null
  max: number | null
  registrations: Registration[]
}

interface Activity {
  id: ActivityId
  name: string
  location: string | null
  slots: Slot[]
}

interface Registration {
  id: RegistrationId
  personName: string
}

interface Batch {
  id: string
  adults: number
  children: number
  families: number
  recordedAt: number
}

interface SubCounter {
  id: string
  label: string
  batches: Batch[]
}

interface EntryLog {
  id: EntryId
  editionId: string
  subCounters: SubCounter[]
}

interface FestState {
  activities: Activity[]
  entryLog: EntryLog | null
}

type FestDomainEvent = {
  type: string
  module: string
  aggregateId: string | null
  payload: unknown
  occurredAt: string
}

type CreateActivityPayload = { name: string }
type UpdateActivityNamePayload = { activityId: ActivityId; name: string }
type DeleteActivityPayload = { activityId: ActivityId }
type AddSlotToActivityPayload = { activityId: ActivityId; day: string; startTime: string; endTime: string; min?: number | null; max?: number | null }
type RegisterToActivityPayload = { activityId: ActivityId; slotId: FestSlotId; personName: string }
type CancelRegistrationPayload = { activityId: ActivityId; slotId: FestSlotId; registrationId: RegistrationId }
type UpdateRegistrationPayload = { activityId: ActivityId; slotId: FestSlotId; registrationId: RegistrationId; personName: string }
type AddSubCounterPayload = { label: string }
type RemoveSubCounterPayload = { subCounterId: string }
type RecordSubCounterEntriesPayload = { subCounterId: string; adults: number; children: number; families: number }
type UpdateSubCounterBatchPayload = { subCounterId: string; batchId: string; adults: number; children: number; families: number }
type DeleteSubCounterBatchPayload = { subCounterId: string; batchId: string }

/**
 * Handles commands for the Fest module
 */
export class FestCommandHandler {
  readonly #projection: FestProjection

  constructor(projection: FestProjection) {
    this.#projection = projection
  }

  /**
   * Execute a command and return the domain event
   */
  execute(action: string, payload: unknown): FestDomainEvent {
    const state = this.#projection.rebuild() as FestState

    switch (action) {
      case 'CreateActivity':
        return new CreateActivity().execute(payload as CreateActivityPayload)

      case 'UpdateActivityName': {
        const p = payload as UpdateActivityNamePayload
        const activity = state.activities.find((a) => a.id === p.activityId)
        if (!activity) throw new Error(`Activity not found: ${p.activityId}`)
        return new UpdateActivityName().execute({ activity, name: p.name })
      }

      case 'DeleteActivity':
        return new DeleteActivity().execute(payload as DeleteActivityPayload)

      case 'AddSlotToActivity': {
        const p = payload as AddSlotToActivityPayload
        const activity = state.activities.find((a) => a.id === p.activityId)
        if (!activity) throw new Error(`Activity not found: ${p.activityId}`)
        return new AddSlotToActivity().execute({ activity, day: p.day, startTime: p.startTime, endTime: p.endTime, min: p.min ?? null, max: p.max ?? null })
      }

      case 'RegisterToActivity': {
        const p = payload as RegisterToActivityPayload
        const activity = state.activities.find((a) => a.id === p.activityId)
        if (!activity) throw new Error(`Activity not found: ${p.activityId}`)
        return new RegisterToActivity().execute({ activity, slotId: p.slotId, personName: p.personName })
      }

      case 'CancelRegistration': {
        const p = payload as CancelRegistrationPayload
        const activity = state.activities.find((a) => a.id === p.activityId)
        if (!activity) throw new Error(`Activity not found: ${p.activityId}`)
        return new CancelRegistration().execute({ activity, slotId: p.slotId, registrationId: p.registrationId })
      }

      case 'UpdateRegistration': {
        const p = payload as UpdateRegistrationPayload
        const activity = state.activities.find((a) => a.id === p.activityId)
        if (!activity) throw new Error(`Activity not found: ${p.activityId}`)
        return new UpdateRegistration().execute({ activity, slotId: p.slotId, registrationId: p.registrationId, personName: p.personName })
      }

      case 'AddSubCounter':
        return new AddSubCounter().execute({ entryLog: state.entryLog, label: (payload as AddSubCounterPayload).label, editionId: EDITION_ID })

      case 'RemoveSubCounter': {
        if (!state.entryLog) throw new Error('No entry log found')
        return new RemoveSubCounter().execute({ entryLog: state.entryLog, subCounterId: (payload as RemoveSubCounterPayload).subCounterId })
      }

      case 'RecordSubCounterEntries': {
        if (!state.entryLog) throw new Error('No entry log found')
        const p = payload as RecordSubCounterEntriesPayload
        return new RecordSubCounterEntries().execute({ entryLog: state.entryLog, subCounterId: p.subCounterId, adults: p.adults, children: p.children, families: p.families })
      }

      case 'UpdateSubCounterBatch': {
        if (!state.entryLog) throw new Error('No entry log found')
        const p = payload as UpdateSubCounterBatchPayload
        return new UpdateSubCounterBatch().execute({ entryLog: state.entryLog, subCounterId: p.subCounterId, batchId: p.batchId, adults: p.adults, children: p.children, families: p.families })
      }

      case 'DeleteSubCounterBatch': {
        if (!state.entryLog) throw new Error('No entry log found')
        const p = payload as DeleteSubCounterBatchPayload
        return new DeleteSubCounterBatch().execute({ entryLog: state.entryLog, subCounterId: p.subCounterId, batchId: p.batchId })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}
