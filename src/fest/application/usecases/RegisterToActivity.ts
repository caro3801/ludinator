import { Activity } from '../../domain/model/Activity'
import { RegistrationAdded } from '../../domain/events'

export class RegisterToActivity {
  execute({ activity: activityData, slotId, personName }) {
    const activity = Activity.fromJSON(activityData)
    activity.findSlot(slotId).addRegistration(personName)
    return new RegistrationAdded({ activity: activity.toJSON() })
  }
}
