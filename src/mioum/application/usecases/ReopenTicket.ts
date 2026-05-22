import { Ticket } from '../../domain/model/Ticket'
import { TicketReopened } from '../../domain/events'

export class ReopenTicket {
  execute({ ticket: ticketData }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.reopen()
    return new TicketReopened({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
