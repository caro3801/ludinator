import { Activity } from '../../domain/model/Activity'
import { ActivityId } from '../../../shared/types'

export class InMemoryActivityRepository {
  #store = new Map<ActivityId, Activity>()

  async save(activity: Activity): Promise<void> { this.#store.set(activity.id, activity) }
  async findById(id: ActivityId): Promise<Activity | null> { return this.#store.get(id) ?? null }
  async findAll(): Promise<Activity[]> { return [...this.#store.values()] }
  async delete(id: ActivityId): Promise<void> { this.#store.delete(id) }
}
