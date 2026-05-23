import { VolunteerRepository } from '../../ports/VolunteerRepository'
import { Volunteer } from '../../domain/model/Volunteer'
import { VolunteerId } from '../../../shared/types'

export class InMemoryVolunteerRepository implements VolunteerRepository {
  #store = new Map<VolunteerId, Volunteer>()

  async save(volunteer: Volunteer): Promise<void> { this.#store.set(volunteer.id as VolunteerId, volunteer) }
  async findById(id: VolunteerId): Promise<Volunteer | null> { return this.#store.get(id) ?? null }
  async findAll(): Promise<Volunteer[]> { return Array.from(this.#store.values()) }
  async delete(id: VolunteerId): Promise<void> { this.#store.delete(id) }
}
