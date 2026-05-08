import { Ticket } from '../../domain/model/Ticket.js'
import { LineDecremented } from '../../domain/events.js'

export class DecrementLineQuantity {
  execute({ ticket: ticketData, lineId }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.decrementLine(lineId)
    return new LineDecremented({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
