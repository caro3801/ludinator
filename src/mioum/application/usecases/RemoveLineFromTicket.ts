import { Ticket } from '../../domain/model/Ticket'
import { LineRemovedFromTicket } from '../../domain/events'

export class RemoveLineFromTicket {
  execute({ ticket: ticketData, lineId }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.removeLine(lineId)
    return new LineRemovedFromTicket({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
