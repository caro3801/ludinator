import { Ticket } from '../../domain/model/Ticket'
import { TicketClosed } from '../../domain/events'

export class CloseTicket {
  execute({ ticket: ticketData, paymentMethod = null }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.close(paymentMethod)
    return new TicketClosed({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
