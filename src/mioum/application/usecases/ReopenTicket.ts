import { Ticket } from '../../domain/model/Ticket'
import { TicketReopened } from '../../domain/events'
import { TicketId, TicketLineId, ProductId } from '../../../shared/types'

interface ReopenTicketParams {
  ticket: { id: TicketId, lines: { id: TicketLineId, productId: ProductId, productName: string, unitPrice: number, quantity: number }[], status: 'open' | 'closed' | 'cancelled', paymentMethod: string | null, closedAt: number | null }
}

export class ReopenTicket {
  execute({ ticket: ticketData }: ReopenTicketParams): TicketReopened {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.reopen()
    return new TicketReopened({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
