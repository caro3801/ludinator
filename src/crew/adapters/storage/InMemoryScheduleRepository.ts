import { ScheduleRepository } from '../../ports/ScheduleRepository'
import { Schedule } from '../../domain/model/Schedule'
import { EditionId, ScheduleId } from '../../../shared/types'

export class InMemoryScheduleRepository implements ScheduleRepository {
  #store = new Map<EditionId, Schedule>()

  async save(schedule: Schedule): Promise<void> { this.#store.set(schedule.editionId as EditionId, schedule) }
  async findById(id: ScheduleId): Promise<Schedule | null> { return null }
  async findByEdition(editionId: EditionId): Promise<Schedule | null> { return this.#store.get(editionId) ?? null }
  async findAll(): Promise<Schedule[]> { return Array.from(this.#store.values()) }
  async delete(id: ScheduleId): Promise<void> { this.#store.delete(id as EditionId) }
}
