import { Ticket } from '../../domain/model/Ticket'
import { LineRemovedFromTicket } from '../../domain/events'
import { TicketId, TicketLineId, ProductId } from '../../../shared/types'

interface RemoveLineFromTicketParams {
  ticket: { id: TicketId, lines: { id: TicketLineId, productId: ProductId, productName: string, unitPrice: number, quantity: number }[], status: 'open' | 'closed' | 'cancelled', paymentMethod: string | null, closedAt: number | null }
  lineId: TicketLineId
}

export class RemoveLineFromTicket {
  execute({ ticket: ticketData, lineId }: RemoveLineFromTicketParams): LineRemovedFromTicket {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.removeLine(lineId)
    return new LineRemovedFromTicket({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
