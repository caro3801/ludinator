import { Ticket } from '../../domain/model/Ticket'
import { TicketOpened } from '../../domain/events'

export class OpenTicket {
  execute(): TicketOpened {
    const ticket = Ticket.create()
    return new TicketOpened({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
