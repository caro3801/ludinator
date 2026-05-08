import { describe, it, expect } from 'vitest'
import { AddLineToTicket } from './AddLineToTicket.js'
import { LineAddedToTicket } from '../../domain/events.js'
import { Ticket } from '../../domain/model/Ticket.js'
import { Product } from '../../domain/model/Product.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'

describe('AddLineToTicket', () => {
  it('emits LineAddedToTicket with updated total', () => {
    const ticket = Ticket.create().toJSON()
    const product = Product.create('Crêpe', 2.50, 'Snacks').toJSON()
    const event = new AddLineToTicket().execute({ ticket, product, quantity: 3 })
    expect(event).toBeInstanceOf(LineAddedToTicket)
    expect(event.payload.total).toBe(7.50)
    expect(event.payload.lines).toHaveLength(1)
  })

  it('throws ValidationError when adding to a closed ticket', () => {
    const product = Product.create('Crêpe', 2.50, 'Snacks')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 1)
    t.close('cash')
    const product2 = Product.create('Eau', 1.0, 'Boissons')
    expect(() => new AddLineToTicket().execute({ ticket: t.toJSON(), product: product2.toJSON(), quantity: 1 }))
      .toThrow(ValidationError)
  })

  it('throws ValidationError when quantity < 1', () => {
    const ticket = Ticket.create().toJSON()
    const product = Product.create('Crêpe', 2.50, 'Snacks').toJSON()
    expect(() => new AddLineToTicket().execute({ ticket, product, quantity: 0 }))
      .toThrow(ValidationError)
  })
})
