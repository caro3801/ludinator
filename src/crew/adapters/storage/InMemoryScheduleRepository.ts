import { ScheduleRepository } from '../../ports/ScheduleRepository'

export class InMemoryScheduleRepository implements ScheduleRepository {
  #store = new Map()

  async save(schedule) { this.#store.set(schedule.editionId, schedule) }
  async findByEdition(editionId) { return this.#store.get(editionId) ?? null }
}
