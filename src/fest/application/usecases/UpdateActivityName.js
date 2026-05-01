import { ValidationError } from '../../domain/errors/ValidationError.js'

export class UpdateActivityName {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ activityId, name }) {
    const activity = await this.#repo.findById(activityId)
    if (!activity) throw new ValidationError(`Activity not found: ${activityId}`)
    activity.updateName(name)
    await this.#repo.save(activity)
    return activity
  }
}
