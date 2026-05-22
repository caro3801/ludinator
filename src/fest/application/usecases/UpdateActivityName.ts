import { Activity } from '../../domain/model/Activity'
import { ActivityNameUpdated } from '../../domain/events'

export class UpdateActivityName {
  execute({ activity: activityData, name }) {
    const activity = Activity.fromJSON(activityData)
    activity.updateName(name)
    return new ActivityNameUpdated({ activity: activity.toJSON() })
  }
}
