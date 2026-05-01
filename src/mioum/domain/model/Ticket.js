import { ValidationError } from '../errors/ValidationError.js'
import { generateId } from '../../../shared/generateId.js'
import { PaymentMethod } from './PaymentMethod.js'
import { Price } from './Price.js'

class TicketLine {
  #id
  #productId
  #productName
  #unitPrice
  #quantity

  constructor(id, productId, productName, unitPrice, quantity) {
    this.#id = id
    this.#productId = productId
    this.#productName = productName
    this.#unitPrice = unitPrice
    this.#quantity = quantity
  }

  get id() { return this.#id }
  get productId() { return this.#productId }
  get productName() { return this.#productName }
  get unitPrice() { return this.#unitPrice }
  get quantity() { return this.#quantity }
  get subtotal() { return this.#unitPrice * this.#quantity }

  toJSON() {
    return {
      id: this.#id,
      productId: this.#productId,
      productName: this.#productName,
      unitPrice: this.#unitPrice,
      quantity: this.#quantity,
    }
  }

  static fromJSON({ id, productId, productName, unitPrice, quantity }) {
    return new TicketLine(id, productId, productName, unitPrice, quantity)
  }

  static create(productId, productName, unitPrice, quantity) {
    Price.create(unitPrice)
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ValidationError('quantity must be a positive integer')
    }
    return new TicketLine(generateId(), productId, productName, unitPrice, quantity)
  }
}

export class Ticket {
  #id
  #lines
  #status
  #paymentMethod
  #closedAt

  constructor(id, lines, status, paymentMethod, closedAt) {
    this.#id = id
    this.#lines = lines
    this.#status = status
    this.#paymentMethod = paymentMethod
    this.#closedAt = closedAt
  }

  get id() { return this.#id }
  get lines() { return [...this.#lines] }
  get status() { return this.#status }
  get paymentMethod() { return this.#paymentMethod }
  get closedAt() { return this.#closedAt }
  get total() { return this.#lines.reduce((sum, line) => sum + line.subtotal, 0) }
  get isOpen() { return this.#status === 'open' }

  addLine(productId, productName, unitPrice, quantity) {
    if (!this.isOpen) throw new ValidationError('Ticket is not open')
    const existing = this.#lines.find(l => l.productId === productId)
    if (existing) {
      const merged = TicketLine.create(productId, existing.productName, existing.unitPrice, existing.quantity + quantity)
      this.#lines = this.#lines.map(l => l.productId === productId ? merged : l)
      return merged
    }
    const line = TicketLine.create(productId, productName, unitPrice, quantity)
    this.#lines.push(line)
    return line
  }

  removeLine(lineId) {
    if (!this.isOpen) throw new ValidationError('Ticket is not open')
    this.#lines = this.#lines.filter(l => l.id !== lineId)
  }

  close(rawPaymentMethod = null) {
    if (!this.isOpen) throw new ValidationError('Ticket is not open')
    if (this.#lines.length === 0) throw new ValidationError('Ticket has no lines')
    this.#status = 'closed'
    this.#paymentMethod = rawPaymentMethod !== null ? new PaymentMethod(rawPaymentMethod).value : null
    this.#closedAt = Date.now()
  }

  cancel() {
    if (!this.isOpen) throw new ValidationError('Ticket is not open')
    this.#status = 'cancelled'
  }

  toJSON() {
    return {
      id: this.#id,
      lines: this.#lines.map(l => l.toJSON()),
      status: this.#status,
      paymentMethod: this.#paymentMethod,
      closedAt: this.#closedAt,
    }
  }

  static fromJSON({ id, lines, status, paymentMethod, closedAt }) {
    return new Ticket(
      id,
      lines.map(l => TicketLine.fromJSON(l)),
      status,
      paymentMethod,
      closedAt,
    )
  }

  static create() {
    return new Ticket(generateId(), [], 'open', null, null)
  }
}
