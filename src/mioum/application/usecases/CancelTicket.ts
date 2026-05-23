import { Ticket } from '../../domain/model/Ticket'
import { TicketCancelled } from '../../domain/events'
import { TicketData } from '../../domain/model/Ticket'
import { TicketId } from '../../../shared/types'

interface CancelTicketParams {
  ticket: TicketData
}

export class CancelTicket {
  execute({ ticket: ticketData }: CancelTicketParams): TicketCancelled {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.cancel()
    return new TicketCancelled({ ticket })
  }
}
