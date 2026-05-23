import { Ticket } from '../../domain/model/Ticket'
import { LineRemovedFromTicket } from '../../domain/events'
import { TicketData } from '../../domain/model/Ticket'
import { TicketLineId } from '../../../shared/types'

interface RemoveLineFromTicketParams {
  ticket: TicketData
  lineId: TicketLineId
}

export class RemoveLineFromTicket {
  execute({ ticket: ticketData, lineId }: RemoveLineFromTicketParams): LineRemovedFromTicket {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.removeLine(lineId)
    return new LineRemovedFromTicket({ ticket })
  }
}
