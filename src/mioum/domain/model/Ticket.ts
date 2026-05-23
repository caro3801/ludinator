import { ValidationError } from '../errors/ValidationError'
import { generateId } from '../../../shared/generateId'
import { PaymentMethod, PaymentMethodValue } from './PaymentMethod'
import { Price } from './Price'
import { TicketId, TicketLineId, ProductId } from '../../../shared/types'

export interface TicketLineData {
  id: TicketLineId
  productId: ProductId
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface TicketData {
  id: TicketId
  lines: TicketLineData[]
  status: 'open' | 'closed' | 'cancelled'
  paymentMethod: PaymentMethodValue | null
  closedAt: number | null
}

class TicketLine {
  #id: TicketLineId
  #productId: ProductId
  #productName: string
  #unitPrice: number
  #quantity: number

  constructor(id: TicketLineId, productId: ProductId, productName: string, unitPrice: number, quantity: number) {
    this.#id = id
    this.#productId = productId
    this.#productName = productName
    this.#unitPrice = unitPrice
    this.#quantity = quantity
  }

  get id(): TicketLineId { return this.#id }
  get productId(): ProductId { return this.#productId }
  get productName(): string { return this.#productName }
  get unitPrice(): number { return this.#unitPrice }
  get quantity(): number { return this.#quantity }
  get subtotal(): number { return this.#unitPrice * this.#quantity }

  withQuantity(quantity: number): TicketLine {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ValidationError('quantity must be a positive integer')
    }
    return new TicketLine(this.#id, this.#productId, this.#productName, this.#unitPrice, quantity)
  }

  toJSON(): TicketLineData {
    return {
      id: this.#id,
      productId: this.#productId,
      productName: this.#productName,
      unitPrice: this.#unitPrice,
      quantity: this.#quantity,
      subtotal: this.#unitPrice * this.#quantity,
    }
  }

  static fromJSON(data: TicketLineData): TicketLine {
    return new TicketLine(data.id, data.productId, data.productName, data.unitPrice, data.quantity)
  }

  static create(productId: ProductId, productName: string, unitPrice: number, quantity: number): TicketLine {
    Price.create(unitPrice)
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ValidationError('quantity must be a positive integer')
    }
    return new TicketLine(generateId() as TicketLineId, productId, productName, unitPrice, quantity)
  }
}

export class Ticket {
  #id: TicketId
  #lines: TicketLine[]
  #status: 'open' | 'closed' | 'cancelled'
  #paymentMethod: PaymentMethodValue | null
  #closedAt: number | null

  constructor(id: TicketId, lines: TicketLine[], status: 'open' | 'closed' | 'cancelled', paymentMethod: PaymentMethodValue | null, closedAt: number | null) {
    this.#id = id
    this.#lines = lines
    this.#status = status
    this.#paymentMethod = paymentMethod
    this.#closedAt = closedAt
  }

  get id(): TicketId { return this.#id }
  get lines(): TicketLine[] { return [...this.#lines] }
  get status(): 'open' | 'closed' | 'cancelled' { return this.#status }
  get paymentMethod(): PaymentMethodValue | null { return this.#paymentMethod }
  get closedAt(): number | null { return this.#closedAt }
  get total(): number { return this.#lines.reduce((sum, line) => sum + line.subtotal, 0) }
  get isOpen(): boolean { return this.#status === 'open' }

  addLine(productId: ProductId, productName: string, unitPrice: number, quantity: number): TicketLine {
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

  removeLine(lineId: TicketLineId): void {
    if (!this.isOpen) throw new ValidationError('Ticket is not open')
    this.#lines = this.#lines.filter(l => l.id !== lineId)
  }

  decrementLine(lineId: TicketLineId): void {
    if (!this.isOpen) throw new ValidationError('Ticket is not open')
    const line = this.#lines.find(l => l.id === lineId)
    if (!line) return
    if (line.quantity === 1) {
      this.#lines = this.#lines.filter(l => l.id !== lineId)
    } else {
      this.#lines = this.#lines.map(l => l.id === lineId ? l.withQuantity(l.quantity - 1) : l)
    }
  }

  close(rawPaymentMethod: string | null = null): void {
    if (!this.isOpen) throw new ValidationError('Ticket is not open')
    if (this.#lines.length === 0) throw new ValidationError('Ticket has no lines')
    this.#status = 'closed'
    this.#paymentMethod = rawPaymentMethod !== null ? new PaymentMethod(rawPaymentMethod).value : null
    this.#closedAt = Date.now()
  }

  cancel(): void {
    if (!this.isOpen) throw new ValidationError('Ticket is not open')
    this.#status = 'cancelled'
  }

  reopen(): void {
    if (this.#status !== 'closed') throw new ValidationError('Only a closed ticket can be reopened')
    this.#status = 'open'
    this.#paymentMethod = null
    this.#closedAt = null
  }

  toJSON(): TicketData {
    return {
      id: this.#id,
      lines: this.#lines.map(l => l.toJSON()),
      status: this.#status,
      paymentMethod: this.#paymentMethod,
      closedAt: this.#closedAt,
    }
  }

  static fromJSON(data: TicketData): Ticket {
    return new Ticket(
      data.id,
      data.lines.map(l => TicketLine.fromJSON(l)),
      data.status,
      data.paymentMethod,
      data.closedAt,
    )
  }

  static create(): Ticket {
    return new Ticket(generateId() as TicketId, [], 'open', null, null)
  }
}
