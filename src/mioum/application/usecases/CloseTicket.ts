import { Ticket } from '../../domain/model/Ticket'
import { TicketClosed } from '../../domain/events'
import { TicketId, TicketLineId, ProductId } from '../../../shared/types'

interface CloseTicketParams {
  ticket: { id: TicketId, lines: { id: TicketLineId, productId: ProductId, productName: string, unitPrice: number, quantity: number }[], status: 'open' | 'closed' | 'cancelled', paymentMethod: string | null, closedAt: number | null }
  paymentMethod?: string | null
}

export class CloseTicket {
  execute({ ticket: ticketData, paymentMethod = null }: CloseTicketParams): TicketClosed {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.close(paymentMethod)
    return new TicketClosed({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
