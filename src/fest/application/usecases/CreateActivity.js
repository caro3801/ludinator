import { Activity } from '../../domain/model/Activity.js'
import { ActivityCreated } from '../../domain/events.js'

export class CreateActivity {
  execute({ name, location = null }) {
    const activity = Activity.create(name, location)
    return new ActivityCreated({ activity: activity.toJSON() })
  }
}
