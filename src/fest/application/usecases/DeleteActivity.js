import { ValidationError } from '../../domain/errors/ValidationError.js'

export class DeleteActivity {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ activityId }) {
    const activity = await this.#repo.findById(activityId)
    if (!activity) throw new ValidationError(`Activity not found: ${activityId}`)
    await this.#repo.delete(activityId)
  }
}
