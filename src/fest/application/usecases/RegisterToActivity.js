import { Activity } from '../../domain/model/Activity.js'
import { RegistrationAdded } from '../../domain/events.js'

export class RegisterToActivity {
  execute({ activity: activityData, slotId, personName }) {
    const activity = Activity.fromJSON(activityData)
    activity.findSlot(slotId).addRegistration(personName)
    return new RegistrationAdded({ activity: activity.toJSON() })
  }
}
