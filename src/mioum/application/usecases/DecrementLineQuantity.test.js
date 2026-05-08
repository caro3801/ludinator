import { describe, it, expect } from 'vitest'
import { DecrementLineQuantity } from './DecrementLineQuantity.js'
import { LineDecremented } from '../../domain/events.js'
import { Ticket } from '../../domain/model/Ticket.js'
import { Product } from '../../domain/model/Product.js'

describe('DecrementLineQuantity', () => {
  it('emits LineDecremented with quantity reduced by 1', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 3)
    const lineId = t.lines[0].id
    const event = new DecrementLineQuantity().execute({ ticket: t.toJSON(), lineId })
    expect(event).toBeInstanceOf(LineDecremented)
    expect(event.payload.lines[0].quantity).toBe(2)
  })
})
