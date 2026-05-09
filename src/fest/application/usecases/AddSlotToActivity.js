import { Activity } from '../../domain/model/Activity.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'
import { SlotAddedToActivity } from '../../domain/events.js'

export class AddSlotToActivity {
  execute({ activity: activityData, day, startTime, endTime, min = null, max = null }) {
    const activity = Activity.fromJSON(activityData)
    activity.addSlot(new TimeWindow(day, startTime, endTime), { min, max })
    return new SlotAddedToActivity({ activity: activity.toJSON() })
  }
}
