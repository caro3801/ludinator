import { ValidationError } from '../../domain/errors/ValidationError.js'

export class UpdateRegistration {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ activityId, slotId, registrationId, personName }) {
    const activity = await this.#repo.findById(activityId)
    if (!activity) throw new ValidationError(`Activity not found: ${activityId}`)
    const slot = activity.findSlot(slotId)
    slot.updateRegistration(registrationId, personName)
    await this.#repo.save(activity)
  }
}
