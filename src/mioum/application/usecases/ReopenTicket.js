import { Ticket } from '../../domain/model/Ticket.js'
import { TicketReopened } from '../../domain/events.js'

export class ReopenTicket {
  execute({ ticket: ticketData }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.reopen()
    return new TicketReopened({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
