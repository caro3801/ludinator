import { Activity } from '../../domain/model/Activity.js'

export class InMemoryActivityRepository {
  #store = new Map()

  async save(activity) { this.#store.set(activity.id, activity) }
  async findById(id) { return this.#store.get(id) ?? null }
  async findAll() { return [...this.#store.values()] }
  async delete(id) { this.#store.delete(id) }
}
