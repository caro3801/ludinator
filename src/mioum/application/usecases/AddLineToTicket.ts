import { Ticket } from '../../domain/model/Ticket'
import { Product } from '../../domain/model/Product'
import { LineAddedToTicket } from '../../domain/events'
import { TicketData } from '../../domain/model/Ticket'
import { ProductId } from '../../../shared/types'

interface AddLineToTicketParams {
  ticket: TicketData
  product: { id: ProductId, name: string, price: number, category: string }
  quantity: number
}

export class AddLineToTicket {
  execute({ ticket: ticketData, product: productData, quantity }: AddLineToTicketParams): LineAddedToTicket {
    const ticket = Ticket.fromJSON(ticketData)
    const product = Product.fromJSON(productData)
    ticket.addLine(product.id, product.name.value, product.price.value, quantity)
    return new LineAddedToTicket({ ticket })
  }
}
