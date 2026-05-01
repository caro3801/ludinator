import { ValidationError } from '../../domain/errors/ValidationError.js'

export class RegisterToActivity {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ activityId, slotId, personName }) {
    const activity = await this.#repo.findById(activityId)
    if (!activity) throw new ValidationError(`Activity not found: ${activityId}`)
    const slot = activity.findSlot(slotId)
    const reg = slot.addRegistration(personName)
    await this.#repo.save(activity)
    return reg
  }
}
