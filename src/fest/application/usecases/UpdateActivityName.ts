import { Activity } from '../../domain/model/Activity'
import { ActivityNameUpdated } from '../../domain/events'
import { ActivityId } from '../../../shared/types'

interface UpdateActivityNameParams {
  activity: { id: ActivityId, name: string, location: string | null, slots: unknown[] }
  name: string
}

export class UpdateActivityName {
  execute({ activity: activityData, name }: UpdateActivityNameParams): ActivityNameUpdated {
    const activity = Activity.fromJSON(activityData)
    activity.updateName(name)
    return new ActivityNameUpdated({ activity: activity.toJSON() })
  }
}
