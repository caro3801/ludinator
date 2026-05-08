import { Ticket } from '../../domain/model/Ticket.js'
import { TicketCancelled } from '../../domain/events.js'

export class CancelTicket {
  execute({ ticket: ticketData }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.cancel()
    return new TicketCancelled({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
