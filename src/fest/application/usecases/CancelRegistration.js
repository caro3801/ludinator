import { ValidationError } from '../../domain/errors/ValidationError.js'

export class CancelRegistration {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ activityId, slotId, registrationId }) {
    const activity = await this.#repo.findById(activityId)
    if (!activity) throw new ValidationError(`Activity not found: ${activityId}`)
    const slot = activity.findSlot(slotId)
    slot.removeRegistration(registrationId)
    await this.#repo.save(activity)
  }
}
