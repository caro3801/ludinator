import { Ticket } from '../../domain/model/Ticket'
import { TicketCancelled } from '../../domain/events'
import { TicketId, TicketLineId, ProductId } from '../../../shared/types'

interface CancelTicketParams {
  ticket: { id: TicketId, lines: { id: TicketLineId, productId: ProductId, productName: string, unitPrice: number, quantity: number }[], status: 'open' | 'closed' | 'cancelled', paymentMethod: string | null, closedAt: number | null }
}

export class CancelTicket {
  execute({ ticket: ticketData }: CancelTicketParams): TicketCancelled {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.cancel()
    return new TicketCancelled({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
