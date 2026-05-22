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

const EDITION_ID = 'edition-2024'

interface FestState {
  activities: { id: string; name: string; slots: { id: string }[] }[]
  entryLog: { id: string; subCounters: { id: string }[] } | null
}

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
  execute(action: string, payload: unknown): unknown {
    const state = this.#projection.rebuild() as FestState

    type CreateActivityPayload = { name: string }
    type UpdateActivityNamePayload = { activityId: string; name: string }
    type DeleteActivityPayload = { activityId: string }
    type AddSlotToActivityPayload = { activityId: string; day: string; startTime: string; endTime: string; min?: number | null; max?: number | null }
    type RegisterToActivityPayload = { activityId: string; slotId: string; personName: string }
    type CancelRegistrationPayload = { activityId: string; slotId: string; registrationId: string }
    type UpdateRegistrationPayload = { activityId: string; slotId: string; registrationId: string; personName: string }
    type AddSubCounterPayload = { label: string }
    type RemoveSubCounterPayload = { subCounterId: string }
    type RecordSubCounterEntriesPayload = { subCounterId: string; adults: number; children: number; families: number }
    type UpdateSubCounterBatchPayload = { subCounterId: string; batchId: string; adults: number; children: number; families: number }
    type DeleteSubCounterBatchPayload = { subCounterId: string; batchId: string }

    switch (action) {
      case 'CreateActivity':
        return new CreateActivity().execute(payload as CreateActivityPayload)

      case 'UpdateActivityName': {
        const activity = state.activities.find((a) => a.id === (payload as UpdateActivityNamePayload).activityId)
        if (!activity) throw new Error(`Activity not found: ${(payload as UpdateActivityNamePayload).activityId}`)
        return new UpdateActivityName().execute({ activity, name: (payload as UpdateActivityNamePayload).name })
      }

      case 'DeleteActivity':
        return new DeleteActivity().execute(payload as DeleteActivityPayload)

      case 'AddSlotToActivity': {
        const activity = state.activities.find((a) => a.id === (payload as AddSlotToActivityPayload).activityId)
        if (!activity) throw new Error(`Activity not found: ${(payload as AddSlotToActivityPayload).activityId}`)
        const p = payload as AddSlotToActivityPayload
        return new AddSlotToActivity().execute({ activity, day: p.day, startTime: p.startTime, endTime: p.endTime, min: p.min ?? null, max: p.max ?? null })
      }

      case 'RegisterToActivity': {
        const activity = state.activities.find((a) => a.id === (payload as RegisterToActivityPayload).activityId)
        if (!activity) throw new Error(`Activity not found: ${(payload as RegisterToActivityPayload).activityId}`)
        const p = payload as RegisterToActivityPayload
        return new RegisterToActivity().execute({ activity, slotId: p.slotId, personName: p.personName })
      }

      case 'CancelRegistration': {
        const activity = state.activities.find((a) => a.id === (payload as CancelRegistrationPayload).activityId)
        if (!activity) throw new Error(`Activity not found: ${(payload as CancelRegistrationPayload).activityId}`)
        const p = payload as CancelRegistrationPayload
        return new CancelRegistration().execute({ activity, slotId: p.slotId, registrationId: p.registrationId })
      }

      case 'UpdateRegistration': {
        const activity = state.activities.find((a) => a.id === (payload as UpdateRegistrationPayload).activityId)
        if (!activity) throw new Error(`Activity not found: ${(payload as UpdateRegistrationPayload).activityId}`)
        const p = payload as UpdateRegistrationPayload
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
