import { Ticket } from '../../domain/model/Ticket'
import { TicketOpened } from '../../domain/events'
import { PaymentMethodValue } from '../../domain/model/PaymentMethod'

export class OpenTicket {
  execute(): TicketOpened {
    const ticket = Ticket.create()
    return new TicketOpened({ ticket })
  }
}
