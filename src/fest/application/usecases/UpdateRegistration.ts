import { Activity } from '../../domain/model/Activity'
import { RegistrationUpdated } from '../../domain/events'
import { ActivityId, FestSlotId } from '../../../shared/types'

interface UpdateRegistrationParams {
  activity: { id: ActivityId, name: string, location: string | null, slots: { id: FestSlotId, activityId: ActivityId, window: { day: string, startTime: string, endTime: string }, min: number | null, max: number | null, registrations: { id: string, personName: string }[] }[] }
  slotId: FestSlotId
  registrationId: string
  personName: string
}

export class UpdateRegistration {
  execute({ activity: activityData, slotId, registrationId, personName }: UpdateRegistrationParams): RegistrationUpdated {
    const activity = Activity.fromJSON(activityData)
    activity.findSlot(slotId).updateRegistration(registrationId, personName)
    return new RegistrationUpdated({ activity: activity.toJSON() })
  }
}
