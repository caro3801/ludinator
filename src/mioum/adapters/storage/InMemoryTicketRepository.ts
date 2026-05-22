import { TicketRepository } from '../../ports/TicketRepository'
import { Ticket } from '../../domain/model/Ticket'

type TicketStatus = 'open' | 'closed' | 'cancelled'

/**
 * In-memory implementation of TicketRepository
 */
export class InMemoryTicketRepository implements TicketRepository {
  #store = new Map<string, Ticket>()

  async save(ticket: Ticket): Promise<void> {
    this.#store.set(ticket.id, ticket)
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.#store.get(id) ?? null
  }

  async findAll(): Promise<Ticket[]> {
    return [...this.#store.values()]
  }

  async findByStatus(status: TicketStatus): Promise<Ticket[]> {
    return [...this.#store.values()].filter((t) => t.status === status)
  }

  async delete(id: string): Promise<void> {
    this.#store.delete(id)
  }
}
