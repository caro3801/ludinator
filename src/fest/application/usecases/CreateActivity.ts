import { Activity } from '../../domain/model/Activity'
import { ActivityCreated } from '../../domain/events'

export class CreateActivity {
  execute({ name, location = null }) {
    const activity = Activity.create(name, location)
    return new ActivityCreated({ activity: activity.toJSON() })
  }
}
