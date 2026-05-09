import { CreateActivity } from '../../fest/application/usecases/CreateActivity.js'
import { UpdateActivityName } from '../../fest/application/usecases/UpdateActivityName.js'
import { DeleteActivity } from '../../fest/application/usecases/DeleteActivity.js'
import { AddSlotToActivity } from '../../fest/application/usecases/AddSlotToActivity.js'
import { RegisterToActivity } from '../../fest/application/usecases/RegisterToActivity.js'
import { CancelRegistration } from '../../fest/application/usecases/CancelRegistration.js'
import { UpdateRegistration } from '../../fest/application/usecases/UpdateRegistration.js'
import { AddSubCounter } from '../../fest/application/usecases/AddSubCounter.js'
import { RemoveSubCounter } from '../../fest/application/usecases/RemoveSubCounter.js'
import { RecordSubCounterEntries } from '../../fest/application/usecases/RecordSubCounterEntries.js'
import { UpdateSubCounterBatch } from '../../fest/application/usecases/UpdateSubCounterBatch.js'
import { DeleteSubCounterBatch } from '../../fest/application/usecases/DeleteSubCounterBatch.js'

const EDITION_ID = 'edition-2024'

export class FestCommandHandler {
  #projection

  constructor(projection) {
    this.#projection = projection
  }

  execute(action, payload) {
    const state = this.#projection.rebuild()

    switch (action) {
      case 'CreateActivity':
        return new CreateActivity().execute(payload)

      case 'UpdateActivityName': {
        const activity = state.activities.find(a => a.id === payload.activityId)
        if (!activity) throw new Error(`Activity not found: ${payload.activityId}`)
        return new UpdateActivityName().execute({ activity, name: payload.name })
      }

      case 'DeleteActivity':
        return new DeleteActivity().execute(payload)

      case 'AddSlotToActivity': {
        const activity = state.activities.find(a => a.id === payload.activityId)
        if (!activity) throw new Error(`Activity not found: ${payload.activityId}`)
        return new AddSlotToActivity().execute({ activity, day: payload.day, startTime: payload.startTime, endTime: payload.endTime, min: payload.min ?? null, max: payload.max ?? null })
      }

      case 'RegisterToActivity': {
        const activity = state.activities.find(a => a.id === payload.activityId)
        if (!activity) throw new Error(`Activity not found: ${payload.activityId}`)
        return new RegisterToActivity().execute({ activity, slotId: payload.slotId, personName: payload.personName })
      }

      case 'CancelRegistration': {
        const activity = state.activities.find(a => a.id === payload.activityId)
        if (!activity) throw new Error(`Activity not found: ${payload.activityId}`)
        return new CancelRegistration().execute({ activity, slotId: payload.slotId, registrationId: payload.registrationId })
      }

      case 'UpdateRegistration': {
        const activity = state.activities.find(a => a.id === payload.activityId)
        if (!activity) throw new Error(`Activity not found: ${payload.activityId}`)
        return new UpdateRegistration().execute({ activity, slotId: payload.slotId, registrationId: payload.registrationId, personName: payload.personName })
      }

      case 'AddSubCounter':
        return new AddSubCounter().execute({ entryLog: state.entryLog, label: payload.label, editionId: EDITION_ID })

      case 'RemoveSubCounter': {
        if (!state.entryLog) throw new Error('No entry log found')
        return new RemoveSubCounter().execute({ entryLog: state.entryLog, subCounterId: payload.subCounterId })
      }

      case 'RecordSubCounterEntries': {
        if (!state.entryLog) throw new Error('No entry log found')
        return new RecordSubCounterEntries().execute({ entryLog: state.entryLog, subCounterId: payload.subCounterId, adults: payload.adults, children: payload.children, families: payload.families })
      }

      case 'UpdateSubCounterBatch': {
        if (!state.entryLog) throw new Error('No entry log found')
        return new UpdateSubCounterBatch().execute({ entryLog: state.entryLog, subCounterId: payload.subCounterId, batchId: payload.batchId, adults: payload.adults, children: payload.children, families: payload.families })
      }

      case 'DeleteSubCounterBatch': {
        if (!state.entryLog) throw new Error('No entry log found')
        return new DeleteSubCounterBatch().execute({ entryLog: state.entryLog, subCounterId: payload.subCounterId, batchId: payload.batchId })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}
