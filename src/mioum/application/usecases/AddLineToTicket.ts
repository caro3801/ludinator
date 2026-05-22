import { Ticket } from '../../domain/model/Ticket'
import { Product } from '../../domain/model/Product'
import { LineAddedToTicket } from '../../domain/events'

export class AddLineToTicket {
  execute({ ticket: ticketData, product: productData, quantity }) {
    const ticket = Ticket.fromJSON(ticketData)
    const product = Product.fromJSON(productData)
    ticket.addLine(product.id, product.name.value, product.price.value, quantity)
    return new LineAddedToTicket({ ticket: { ...ticket.toJSON(), total: ticket.total } })
  }
}
