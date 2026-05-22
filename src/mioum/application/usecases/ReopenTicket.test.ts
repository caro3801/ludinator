import { describe, it, expect } from 'vitest'
import { ReopenTicket } from './ReopenTicket'
import { TicketReopened } from '../../domain/events'
import { Ticket } from '../../domain/model/Ticket'
import { Product } from '../../domain/model/Product'

describe('ReopenTicket', () => {
  it('emits TicketReopened with status open', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 1)
    t.close('cash')
    const event = new ReopenTicket().execute({ ticket: t.toJSON() })
    expect(event).toBeInstanceOf(TicketReopened)
    expect(event.payload.status).toBe('open')
  })
})
