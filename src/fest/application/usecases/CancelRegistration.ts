import { Activity } from '../../domain/model/Activity'
import { RegistrationCancelled } from '../../domain/events'
import { ActivityId, FestSlotId } from '../../../shared/types'

interface CancelRegistrationParams {
  activity: { id: ActivityId, name: string, location: string | null, slots: { id: FestSlotId, activityId: ActivityId, window: { day: string, startTime: string, endTime: string }, min: number | null, max: number | null, registrations: { id: string, personName: string }[] }[] }
  slotId: FestSlotId
  registrationId: string
}

export class CancelRegistration {
  execute({ activity: activityData, slotId, registrationId }: CancelRegistrationParams): RegistrationCancelled {
    const activity = Activity.fromJSON(activityData)
    activity.findSlot(slotId).removeRegistration(registrationId)
    return new RegistrationCancelled({ activity: activity.toJSON() })
  }
}
