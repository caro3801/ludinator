import { Ticket } from '../../domain/model/Ticket'
import { TicketClosed } from '../../domain/events'
import { TicketData } from '../../domain/model/Ticket'
import { PaymentMethodValue } from '../../domain/model/PaymentMethod'
import { TicketId, TicketLineId, ProductId } from '../../../shared/types'

interface CloseTicketParams {
  ticket: TicketData
  paymentMethod?: PaymentMethodValue | null
}

export class CloseTicket {
  execute({ ticket: ticketData, paymentMethod = null }: CloseTicketParams): TicketClosed {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.close(paymentMethod)
    return new TicketClosed({ ticket })
  }
}
