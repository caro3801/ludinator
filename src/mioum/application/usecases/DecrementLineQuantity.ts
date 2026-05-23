import { Ticket } from '../../domain/model/Ticket'
import { LineDecremented } from '../../domain/events'
import { TicketId, TicketLineId, ProductId } from '../../../shared/types'

interface DecrementLineQuantityParams {
  ticket: { id: TicketId, lines: { id: TicketLineId, productId: ProductId, productName: string, unitPrice: number, quantity: number }[], status: 'open' | 'closed' | 'cancelled', paymentMethod: string | null, closedAt: number | null }
  lineId: TicketLineId
}

export class DecrementLineQuantity {
  execute({ ticket: ticketData, lineId }: DecrementLineQuantityParams): LineDecremented {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.decrementLine(lineId)
    return new LineDecremented({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
