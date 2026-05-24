import { ProductId, TicketId } from '../../shared/types'
import { Product } from './model/Product'
import { Ticket } from './model/Ticket'

interface ProductPayload {
  id: ProductId
  name: string
  price: number
  category: string
}

export class ProductCreated {
  readonly type = 'ProductCreated'
  readonly module = 'mioum'
  readonly aggregateId: ProductId
  readonly payload: ProductPayload
  readonly occurredAt: string

  constructor({ product, occurredAt = new Date().toISOString() }: { product: ProductPayload; occurredAt?: string }) {
    this.aggregateId = product.id
    this.payload = product
    this.occurredAt = occurredAt
  }
}

export class ProductUpdated {
  readonly type = 'ProductUpdated'
  readonly module = 'mioum'
  readonly aggregateId: ProductId
  readonly payload: ProductPayload
  readonly occurredAt: string

  constructor({ product, occurredAt = new Date().toISOString() }: { product: ProductPayload; occurredAt?: string }) {
    this.aggregateId = product.id
    this.payload = product
    this.occurredAt = occurredAt
  }
}

export class ProductDeleted {
  readonly type = 'ProductDeleted'
  readonly module = 'mioum'
  readonly aggregateId: ProductId
  readonly payload: { productId: ProductId }
  readonly occurredAt: string

  constructor({ productId, occurredAt = new Date().toISOString() }: { productId: ProductId; occurredAt?: string }) {
    this.aggregateId = productId
    this.payload = { productId }
    this.occurredAt = occurredAt
  }
}

export class TicketOpened {
  readonly type = 'TicketOpened'
  readonly module = 'mioum'
  readonly aggregateId: TicketId
  readonly payload: Ticket
  readonly occurredAt: string

  constructor({ ticket, occurredAt = new Date().toISOString() }: { ticket: Ticket; occurredAt?: string }) {
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class LineAddedToTicket {
  readonly type = 'LineAddedToTicket'
  readonly module = 'mioum'
  readonly aggregateId: TicketId
  readonly payload: Ticket
  readonly occurredAt: string

  constructor({ ticket, occurredAt = new Date().toISOString() }: { ticket: Ticket; occurredAt?: string }) {
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class LineRemovedFromTicket {
  readonly type = 'LineRemovedFromTicket'
  readonly module = 'mioum'
  readonly aggregateId: TicketId
  readonly payload: Ticket
  readonly occurredAt: string

  constructor({ ticket, occurredAt = new Date().toISOString() }: { ticket: Ticket; occurredAt?: string }) {
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class LineDecremented {
  readonly type = 'LineDecremented'
  readonly module = 'mioum'
  readonly aggregateId: TicketId
  readonly payload: Ticket
  readonly occurredAt: string

  constructor({ ticket, occurredAt = new Date().toISOString() }: { ticket: Ticket; occurredAt?: string }) {
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class TicketClosed {
  readonly type = 'TicketClosed'
  readonly module = 'mioum'
  readonly aggregateId: TicketId
  readonly payload: Ticket
  readonly occurredAt: string

  constructor({ ticket, occurredAt = new Date().toISOString() }: { ticket: Ticket; occurredAt?: string }) {
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class TicketCancelled {
  readonly type = 'TicketCancelled'
  readonly module = 'mioum'
  readonly aggregateId: TicketId
  readonly payload: Ticket
  readonly occurredAt: string

  constructor({ ticket, occurredAt = new Date().toISOString() }: { ticket: Ticket; occurredAt?: string }) {
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class TicketReopened {
  readonly type = 'TicketReopened'
  readonly module = 'mioum'
  readonly aggregateId: TicketId
  readonly payload: Ticket
  readonly occurredAt: string

  constructor({ ticket, occurredAt = new Date().toISOString() }: { ticket: Ticket; occurredAt?: string }) {
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}
