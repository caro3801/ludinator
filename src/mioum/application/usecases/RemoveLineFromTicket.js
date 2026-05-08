import { Ticket } from '../../domain/model/Ticket.js'
import { LineRemovedFromTicket } from '../../domain/events.js'

export class RemoveLineFromTicket {
  execute({ ticket: ticketData, lineId }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.removeLine(lineId)
    return new LineRemovedFromTicket({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
