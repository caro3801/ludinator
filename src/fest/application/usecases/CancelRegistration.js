import { Activity } from '../../domain/model/Activity.js'
import { RegistrationCancelled } from '../../domain/events.js'

export class CancelRegistration {
  execute({ activity: activityData, slotId, registrationId }) {
    const activity = Activity.fromJSON(activityData)
    activity.findSlot(slotId).removeRegistration(registrationId)
    return new RegistrationCancelled({ activity: activity.toJSON() })
  }
}
