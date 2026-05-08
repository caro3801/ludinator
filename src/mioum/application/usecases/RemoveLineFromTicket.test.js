import { describe, it, expect } from 'vitest'
import { RemoveLineFromTicket } from './RemoveLineFromTicket.js'
import { LineRemovedFromTicket } from '../../domain/events.js'
import { Ticket } from '../../domain/model/Ticket.js'
import { Product } from '../../domain/model/Product.js'

describe('RemoveLineFromTicket', () => {
  it('emits LineRemovedFromTicket with line removed', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 2)
    const lineId = t.lines[0].id
    const event = new RemoveLineFromTicket().execute({ ticket: t.toJSON(), lineId })
    expect(event).toBeInstanceOf(LineRemovedFromTicket)
    expect(event.payload.lines).toHaveLength(0)
  })
})
