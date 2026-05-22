import { describe, it, expect } from 'vitest'
import { MioumProjection } from './MioumProjection'
import { EventStore } from '../EventStore'
import { Product } from '../../mioum/domain/model/Product'
import { Ticket } from '../../mioum/domain/model/Ticket'

describe('MioumProjection', () => {
  it('starts with empty state', () => {
    const store = new EventStore(':memory:')
    const projection = new MioumProjection(store)
    const state = projection.rebuild()
    expect(state.products).toEqual([])
    expect(state.tickets).toEqual([])
  })

  it('adds product from ProductCreated event', () => {
    const store = new EventStore(':memory:')
    const product = Product.create('Bière', 3.0, 'Boissons').toJSON()
    store.append({ id: '1', module: 'mioum', type: 'ProductCreated', aggregateId: product.id, payload: product, occurredAt: new Date().toISOString() })
    const state = new MioumProjection(store).rebuild()
    expect(state.products).toHaveLength(1)
    expect(state.products[0].name).toBe('Bière')
  })

  it('removes product from ProductDeleted event', () => {
    const store = new EventStore(':memory:')
    const product = Product.create('Bière', 3.0, 'Boissons').toJSON()
    store.append({ id: '1', module: 'mioum', type: 'ProductCreated', aggregateId: product.id, payload: product, occurredAt: '2024-01-01T10:00:00.000Z' })
    store.append({ id: '2', module: 'mioum', type: 'ProductDeleted', aggregateId: product.id, payload: { productId: product.id }, occurredAt: '2024-01-01T10:00:01.000Z' })
    const state = new MioumProjection(store).rebuild()
    expect(state.products).toHaveLength(0)
  })

  it('tracks open ticket as currentTicket', () => {
    const store = new EventStore(':memory:')
    const ticket = Ticket.create().toJSON()
    store.append({ id: '1', module: 'mioum', type: 'TicketOpened', aggregateId: ticket.id, payload: ticket, occurredAt: new Date().toISOString() })
    const state = new MioumProjection(store).rebuild()
    expect(state.currentTicket).toBeDefined()
    expect(state.currentTicket.id).toBe(ticket.id)
    expect(state.currentTicket.status).toBe('open')
  })

  it('clears currentTicket when ticket is closed', () => {
    const store = new EventStore(':memory:')
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 1)
    t.close('cash')
    const closedTicket = { ...t.toJSON(), total: t.total }
    store.append({ id: '1', module: 'mioum', type: 'TicketOpened', aggregateId: closedTicket.id, payload: { ...closedTicket, status: 'open', lines: [] }, occurredAt: '2024-01-01T10:00:00.000Z' })
    store.append({ id: '2', module: 'mioum', type: 'TicketClosed', aggregateId: closedTicket.id, payload: closedTicket, occurredAt: '2024-01-01T10:00:01.000Z' })
    const state = new MioumProjection(store).rebuild()
    expect(state.currentTicket).toBeNull()
    expect(state.tickets).toHaveLength(1)
    expect(state.tickets[0].status).toBe('closed')
  })
})
