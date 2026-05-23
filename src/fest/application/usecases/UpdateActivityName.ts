import { Activity } from '../../domain/model/Activity'
import { ActivityNameUpdated } from '../../domain/events'
import { ActivityId, FestSlotId } from '../../../shared/types'

interface UpdateActivityNameParams {
  activity: { id: ActivityId, name: string, location: string | null, slots: { id: FestSlotId, activityId: ActivityId, window: { day: string, startTime: string, endTime: string }, min: number | null, max: number | null, registrations: { id: string, personName: string }[] }[] }
  name: string
}

export class UpdateActivityName {
  execute({ activity: activityData, name }: UpdateActivityNameParams): ActivityNameUpdated {
    const activity = Activity.fromJSON(activityData)
    activity.updateName(name)
    return new ActivityNameUpdated({ activity: activity.toJSON() })
  }
}
