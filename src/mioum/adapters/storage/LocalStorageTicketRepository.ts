import { TicketRepository } from '../../ports/TicketRepository'
import { Ticket } from '../../domain/model/Ticket'

const KEY = 'mioum:tickets'

type TicketStatus = 'open' | 'closed' | 'cancelled'

/**
 * LocalStorage implementation of TicketRepository
 */
export class LocalStorageTicketRepository implements TicketRepository {
  #read(): Record<string, unknown> {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  }

  #write(data: Record<string, unknown>): void {
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  async save(ticket: Ticket): Promise<void> {
    const data = this.#read()
    data[ticket.id] = ticket.toJSON()
    this.#write(data)
  }

  async findById(id: string): Promise<Ticket | null> {
    const data = this.#read()
    const raw = data[id]
    if (!raw || typeof raw !== 'object') return null
    return Ticket.fromJSON(raw as { id: string; lines: unknown[]; status: TicketStatus; paymentMethod: unknown; closedAt: number | null })
  }

  async findAll(): Promise<Ticket[]> {
    const data = this.#read()
    const values = Object.values(data)
    return values.map((t: unknown) => {
      if (t && typeof t === 'object') {
        return Ticket.fromJSON(t as { id: string; lines: unknown[]; status: TicketStatus; paymentMethod: unknown; closedAt: number | null })
      }
      throw new Error('Invalid ticket data in storage')
    })
  }

  async findByStatus(status: TicketStatus): Promise<Ticket[]> {
    const data = this.#read()
    return Object.values(data)
      .map((t: unknown) => {
        if (t && typeof t === 'object') {
          return Ticket.fromJSON(t as { id: string; lines: unknown[]; status: TicketStatus; paymentMethod: unknown; closedAt: number | null })
        }
        throw new Error('Invalid ticket data in storage')
      })
      .filter((t) => t.status === status)
  }

  async delete(id: string): Promise<void> {
    const data = this.#read()
    delete data[id]
    this.#write(data)
  }
}
