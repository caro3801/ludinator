export class ProductCreated {
  constructor({ product, occurredAt = new Date().toISOString() }) {
    this.type = 'ProductCreated'
    this.module = 'mioum'
    this.aggregateId = product.id
    this.payload = product
    this.occurredAt = occurredAt
  }
}

export class ProductUpdated {
  constructor({ product, occurredAt = new Date().toISOString() }) {
    this.type = 'ProductUpdated'
    this.module = 'mioum'
    this.aggregateId = product.id
    this.payload = product
    this.occurredAt = occurredAt
  }
}

export class ProductDeleted {
  constructor({ productId, occurredAt = new Date().toISOString() }) {
    this.type = 'ProductDeleted'
    this.module = 'mioum'
    this.aggregateId = productId
    this.payload = { productId }
    this.occurredAt = occurredAt
  }
}

export class TicketOpened {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'TicketOpened'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class LineAddedToTicket {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'LineAddedToTicket'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class LineRemovedFromTicket {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'LineRemovedFromTicket'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class LineDecremented {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'LineDecremented'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class TicketClosed {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'TicketClosed'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class TicketCancelled {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'TicketCancelled'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class TicketReopened {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'TicketReopened'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}
