import { ValidationError } from '../../domain/errors/ValidationError.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

export class AddSlotToActivity {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ activityId, day, startTime, endTime, min = null, max = null }) {
    const activity = await this.#repo.findById(activityId)
    if (!activity) throw new ValidationError(`Activity not found: ${activityId}`)
    const slot = activity.addSlot(new TimeWindow(day, startTime, endTime), { min, max })
    await this.#repo.save(activity)
    return slot
  }
}
