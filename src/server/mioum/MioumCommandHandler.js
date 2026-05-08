import { CreateProduct } from '../../mioum/application/usecases/CreateProduct.js'
import { UpdateProduct } from '../../mioum/application/usecases/UpdateProduct.js'
import { DeleteProduct } from '../../mioum/application/usecases/DeleteProduct.js'
import { OpenTicket } from '../../mioum/application/usecases/OpenTicket.js'
import { AddLineToTicket } from '../../mioum/application/usecases/AddLineToTicket.js'
import { RemoveLineFromTicket } from '../../mioum/application/usecases/RemoveLineFromTicket.js'
import { DecrementLineQuantity } from '../../mioum/application/usecases/DecrementLineQuantity.js'
import { CloseTicket } from '../../mioum/application/usecases/CloseTicket.js'
import { CancelTicket } from '../../mioum/application/usecases/CancelTicket.js'
import { ReopenTicket } from '../../mioum/application/usecases/ReopenTicket.js'

export class MioumCommandHandler {
  #projection

  constructor(projection) {
    this.#projection = projection
  }

  execute(action, payload) {
    const state = this.#projection.rebuild()

    switch (action) {
      case 'CreateProduct':
        return new CreateProduct().execute(payload)

      case 'UpdateProduct': {
        const product = state.products.find(p => p.id === payload.productId)
        if (!product) throw new Error(`Product not found: ${payload.productId}`)
        return new UpdateProduct().execute({ product, ...payload })
      }

      case 'DeleteProduct': {
        const product = state.products.find(p => p.id === payload.productId)
        if (!product) throw new Error(`Product not found: ${payload.productId}`)
        return new DeleteProduct().execute(payload)
      }

      case 'OpenTicket':
        return new OpenTicket().execute()

      case 'AddLineToTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        const product = state.products.find(p => p.id === payload.productId)
        if (!product) throw new Error(`Product not found: ${payload.productId}`)
        return new AddLineToTicket().execute({ ticket, product, quantity: payload.quantity })
      }

      case 'RemoveLineFromTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new RemoveLineFromTicket().execute({ ticket, lineId: payload.lineId })
      }

      case 'DecrementLineQuantity': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new DecrementLineQuantity().execute({ ticket, lineId: payload.lineId })
      }

      case 'CloseTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new CloseTicket().execute({ ticket, paymentMethod: payload.paymentMethod })
      }

      case 'CancelTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new CancelTicket().execute({ ticket })
      }

      case 'ReopenTicket': {
        const ticket = state.tickets.find(t => t.id === payload.ticketId)
        if (!ticket) throw new Error(`Ticket not found: ${payload.ticketId}`)
        return new ReopenTicket().execute({ ticket })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}
