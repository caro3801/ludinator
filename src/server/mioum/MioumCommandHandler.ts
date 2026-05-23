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
import { ProductId, TicketId, TicketLineId } from '../../shared/types'

interface Product {
  id: ProductId
  name: string
  price: number
  category: string
}

interface TicketLine {
  id: TicketLineId
  productId: ProductId
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

interface Ticket {
  id: TicketId
  lines: TicketLine[]
  status: 'open' | 'closed' | 'cancelled'
  paymentMethod: string | null
  closedAt: number | null
  total: number
}

interface CurrentTicket {
  id: TicketId
  lines: TicketLine[]
  status: 'open' | 'closed' | 'cancelled'
  paymentMethod: string | null
  closedAt: number | null
  total: number
}

interface MioumState {
  products: Product[]
  tickets: Ticket[]
  currentTicket: CurrentTicket | null
}

type MioumDomainEvent = {
  type: string
  module: string
  aggregateId: string | null
  payload: unknown
  occurredAt: string
}

type CreateProductPayload = { name: string; price: number; category: string }
type UpdateProductPayload = { productId: ProductId; name: string; price: number; category: string }
type DeleteProductPayload = { productId: ProductId }
type AddLineToTicketPayload = { productId: ProductId; quantity: number }
type RemoveLineFromTicketPayload = { lineId: TicketLineId }
type DecrementLineQuantityPayload = { lineId: TicketLineId }
type CloseTicketPayload = { paymentMethod: string }
type CancelTicketPayload = Record<string, never>
type ReopenTicketPayload = { ticketId: TicketId }

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
  execute(action: string, payload: unknown): MioumDomainEvent {
    const state = this.#projection.rebuild() as MioumState

    switch (action) {
      case 'CreateProduct':
        return new CreateProduct().execute(payload as CreateProductPayload)

      case 'UpdateProduct': {
        const p = payload as UpdateProductPayload
        const product = state.products.find((pr) => pr.id === p.productId)
        if (!product) throw new Error(`Product not found: ${p.productId}`)
        return new UpdateProduct().execute({ product, name: p.name, price: p.price, category: p.category })
      }

      case 'DeleteProduct': {
        const p = payload as DeleteProductPayload
        const product = state.products.find((pr) => pr.id === p.productId)
        if (!product) throw new Error(`Product not found: ${p.productId}`)
        return new DeleteProduct().execute(payload as DeleteProductPayload)
      }

      case 'OpenTicket': {
        if (state.currentTicket) throw new Error('A ticket is already open')
        return new OpenTicket().execute()
      }

      case 'AddLineToTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        const p = payload as AddLineToTicketPayload
        const product = state.products.find((pr) => pr.id === p.productId)
        if (!product) throw new Error(`Product not found: ${p.productId}`)
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
        const p = payload as ReopenTicketPayload
        const ticket = state.tickets.find((t) => t.id === p.ticketId)
        if (!ticket) throw new Error(`Ticket not found: ${p.ticketId}`)
        return new ReopenTicket().execute({ ticket })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}
