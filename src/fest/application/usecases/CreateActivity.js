import { Activity } from '../../domain/model/Activity.js'

export class CreateActivity {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ name, location = null }) {
    const activity = Activity.create(name, location)
    await this.#repo.save(activity)
    return activity
  }
}
