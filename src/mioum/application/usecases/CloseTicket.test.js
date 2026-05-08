import { describe, it, expect } from 'vitest'
import { CloseTicket } from './CloseTicket.js'
import { TicketClosed } from '../../domain/events.js'
import { Ticket } from '../../domain/model/Ticket.js'
import { Product } from '../../domain/model/Product.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'

describe('CloseTicket', () => {
  it('emits TicketClosed with status closed', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 1)
    const event = new CloseTicket().execute({ ticket: t.toJSON(), paymentMethod: 'cash' })
    expect(event).toBeInstanceOf(TicketClosed)
    expect(event.payload.status).toBe('closed')
    expect(event.payload.paymentMethod).toBe('cash')
  })

  it('throws ValidationError when ticket is already closed', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 1)
    t.close('cash')
    expect(() => new CloseTicket().execute({ ticket: t.toJSON(), paymentMethod: 'cash' }))
      .toThrow(ValidationError)
  })
})
