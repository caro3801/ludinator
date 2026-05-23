import { Ticket } from '../../domain/model/Ticket'
import { LineDecremented } from '../../domain/events'
import { TicketData } from '../../domain/model/Ticket'
import { TicketLineId } from '../../../shared/types'

interface DecrementLineQuantityParams {
  ticket: TicketData
  lineId: TicketLineId
}

export class DecrementLineQuantity {
  execute({ ticket: ticketData, lineId }: DecrementLineQuantityParams): LineDecremented {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.decrementLine(lineId)
    return new LineDecremented({ ticket })
  }
}
