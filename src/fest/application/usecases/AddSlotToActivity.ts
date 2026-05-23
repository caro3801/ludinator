import { Activity } from '../../domain/model/Activity'
import { TimeWindow } from '../../domain/model/TimeWindow'
import { SlotAddedToActivity } from '../../domain/events'
import { ActivityId, FestSlotId } from '../../../shared/types'

interface AddSlotToActivityParams {
  activity: { id: ActivityId, name: string, location: string | null, slots: { id: FestSlotId, activityId: ActivityId, window: { day: string, startTime: string, endTime: string }, min: number | null, max: number | null, registrations: { id: string, personName: string }[] }[] }
  day: string
  startTime: string
  endTime: string
  min?: number | null
  max?: number | null
}

export class AddSlotToActivity {
  execute({ activity: activityData, day, startTime, endTime, min = null, max = null }: AddSlotToActivityParams): SlotAddedToActivity {
    const activity = Activity.fromJSON(activityData)
    activity.addSlot(new TimeWindow(day, startTime, endTime), { min, max })
    return new SlotAddedToActivity({ activity: activity.toJSON() })
  }
}
