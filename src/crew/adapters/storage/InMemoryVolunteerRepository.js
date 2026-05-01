import { VolunteerRepository } from '../../ports/VolunteerRepository.js'

export class InMemoryVolunteerRepository extends VolunteerRepository {
  #store = new Map()

  async save(volunteer) { this.#store.set(volunteer.id, volunteer) }
  async findById(id) { return this.#store.get(id) ?? null }
  async findAll() { return [...this.#store.values()] }
  async delete(id) { this.#store.delete(id) }
}
