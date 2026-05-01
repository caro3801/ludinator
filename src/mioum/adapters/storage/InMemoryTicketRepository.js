import { TicketRepository } from '../../ports/TicketRepository.js'

export class InMemoryTicketRepository extends TicketRepository {
  #store = new Map()

  async save(ticket) { this.#store.set(ticket.id, ticket) }
  async findById(id) { return this.#store.get(id) ?? null }
  async findAll() { return [...this.#store.values()] }
  async findByStatus(status) { return [...this.#store.values()].filter(t => t.status === status) }
  async delete(id) { this.#store.delete(id) }
}
