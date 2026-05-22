import { Activity } from '../../domain/model/Activity'
import { RegistrationUpdated } from '../../domain/events'

export class UpdateRegistration {
  execute({ activity: activityData, slotId, registrationId, personName }) {
    const activity = Activity.fromJSON(activityData)
    activity.findSlot(slotId).updateRegistration(registrationId, personName)
    return new RegistrationUpdated({ activity: activity.toJSON() })
  }
}
