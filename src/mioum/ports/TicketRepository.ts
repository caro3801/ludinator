import { Ticket } from '../domain/model/Ticket'

type TicketStatus = 'open' | 'closed' | 'cancelled'

/**
 * Port interface for ticket persistence
 */
export interface TicketRepository {
  save(ticket: Ticket): Promise<void>
  findById(id: string): Promise<Ticket | null>
  findAll(): Promise<Ticket[]>
  findByStatus(status: TicketStatus): Promise<Ticket[]>
  delete(id: string): Promise<void>
}
