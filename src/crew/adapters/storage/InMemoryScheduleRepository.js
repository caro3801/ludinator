import { ScheduleRepository } from '../../ports/ScheduleRepository.js'

export class InMemoryScheduleRepository extends ScheduleRepository {
  #store = new Map()

  async save(schedule) { this.#store.set(schedule.editionId, schedule) }
  async findByEdition(editionId) { return this.#store.get(editionId) ?? null }
}
