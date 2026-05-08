import { Ticket } from '../../domain/model/Ticket.js'
import { TicketOpened } from '../../domain/events.js'

export class OpenTicket {
  execute() {
    const ticket = Ticket.create()
    return new TicketOpened({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
