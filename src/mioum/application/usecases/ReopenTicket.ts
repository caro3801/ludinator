import { Ticket } from '../../domain/model/Ticket'
import { TicketReopened } from '../../domain/events'
import { TicketData } from '../../domain/model/Ticket'

interface ReopenTicketParams {
  ticket: TicketData
}

export class ReopenTicket {
  execute({ ticket: ticketData }: ReopenTicketParams): TicketReopened {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.reopen()
    return new TicketReopened({ ticket })
  }
}
