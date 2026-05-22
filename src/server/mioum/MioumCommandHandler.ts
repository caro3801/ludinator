import { CreateProduct } from '../../mioum/application/usecases/CreateProduct'
import { UpdateProduct } from '../../mioum/application/usecases/UpdateProduct'
import { DeleteProduct } from '../../mioum/application/usecases/DeleteProduct'
import { OpenTicket } from '../../mioum/application/usecases/OpenTicket'
import { AddLineToTicket } from '../../mioum/application/usecases/AddLineToTicket'
import { RemoveLineFromTicket } from '../../mioum/application/usecases/RemoveLineFromTicket'
import { DecrementLineQuantity } from '../../mioum/application/usecases/DecrementLineQuantity'
import { CloseTicket } from '../../mioum/application/usecases/CloseTicket'
import { CancelTicket } from '../../mioum/application/usecases/CancelTicket'
import { ReopenTicket } from '../../mioum/application/usecases/ReopenTicket'
import { MioumProjection } from './MioumProjection'

interface MioumState {
  products: { id: string; name: string; price: number; stock: number }[]
  tickets: { id: string }[]
  currentTicket: { id: string; lines: { id: string; productId: string; quantity: number; price: number }[] } | null
}

/**
 * Handles commands for the Mioum module
 */
export class MioumCommandHandler {
  readonly #projection: MioumProjection

  constructor(projection: MioumProjection) {
    this.#projection = projection
  }

  /**
   * Execute a command and return the domain event
   */
  execute(action: string, payload: unknown): unknown {
    const state = this.#projection.rebuild() as MioumState

    type CreateProductPayload = { name: string; price: number; stock: number }
    type UpdateProductPayload = { productId: string; name?: string; price?: number; stock?: number }
    type DeleteProductPayload = { productId: string }
    type AddLineToTicketPayload = { productId: string; quantity: number }
    type RemoveLineFromTicketPayload = { lineId: string }
    type DecrementLineQuantityPayload = { lineId: string }
    type CloseTicketPayload = { paymentMethod: string }
    type CancelTicketPayload = {}
    type ReopenTicketPayload = { ticketId: string }

    switch (action) {
      case 'CreateProduct':
        return new CreateProduct().execute(payload as CreateProductPayload)

      case 'UpdateProduct': {
        const product = state.products.find((p) => p.id === (payload as UpdateProductPayload).productId)
        if (!product) throw new Error(`Product not found: ${(payload as UpdateProductPayload).productId}`)
        return new UpdateProduct().execute({ product, ...(payload as UpdateProductPayload) })
      }

      case 'DeleteProduct': {
        const product = state.products.find((p) => p.id === (payload as DeleteProductPayload).productId)
        if (!product) throw new Error(`Product not found: ${(payload as DeleteProductPayload).productId}`)
        return new DeleteProduct().execute(payload as DeleteProductPayload)
      }

      case 'OpenTicket': {
        if (state.currentTicket) throw new Error('A ticket is already open')
        return new OpenTicket().execute()
      }

      case 'AddLineToTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        const product = state.products.find((p) => p.id === (payload as AddLineToTicketPayload).productId)
        if (!product) throw new Error(`Product not found: ${(payload as AddLineToTicketPayload).productId}`)
        const p = payload as AddLineToTicketPayload
        return new AddLineToTicket().execute({ ticket, product, quantity: p.quantity })
      }

      case 'RemoveLineFromTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new RemoveLineFromTicket().execute({ ticket, lineId: (payload as RemoveLineFromTicketPayload).lineId })
      }

      case 'DecrementLineQuantity': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new DecrementLineQuantity().execute({ ticket, lineId: (payload as DecrementLineQuantityPayload).lineId })
      }

      case 'CloseTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new CloseTicket().execute({ ticket, paymentMethod: (payload as CloseTicketPayload).paymentMethod })
      }

      case 'CancelTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new CancelTicket().execute({ ticket })
      }

      case 'ReopenTicket': {
        const ticket = state.tickets.find((t) => t.id === (payload as ReopenTicketPayload).ticketId)
        if (!ticket) throw new Error(`Ticket not found: ${(payload as ReopenTicketPayload).ticketId}`)
        return new ReopenTicket().execute({ ticket })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}
