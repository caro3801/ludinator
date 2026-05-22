import { describe, it, expect, beforeEach } from 'vitest'
import { MioumCommandHandler } from './MioumCommandHandler'
import { MioumProjection } from './MioumProjection'
import { EventStore } from '../EventStore'

describe('MioumCommandHandler', () => {
  let store, projection, handler

  beforeEach(() => {
    store = new EventStore(':memory:')
    projection = new MioumProjection(store)
    handler = new MioumCommandHandler(projection)
  })

  it('CreateProduct returns ProductCreated event', () => {
    const event = handler.execute('CreateProduct', { name: 'Bière', price: 3.5, category: 'Boissons' })
    expect(event.type).toBe('ProductCreated')
    expect(event.payload.name).toBe('Bière')
  })

  it('DeleteProduct throws when product not found', () => {
    expect(() => handler.execute('DeleteProduct', { productId: 'nonexistent' }))
      .toThrow('Product not found')
  })

  it('AddLineToTicket throws when no open ticket', () => {
    expect(() => handler.execute('AddLineToTicket', { productId: 'p1', quantity: 1 }))
      .toThrow('No open ticket')
  })

  it('full flow: create product, open ticket, add line', () => {
    const created = handler.execute('CreateProduct', { name: 'Bière', price: 3.0, category: 'Boissons' })
    store.append({ ...created, id: '1' })

    const opened = handler.execute('OpenTicket', {})
    store.append({ ...opened, id: '2' })

    const productId = projection.rebuild().products[0].id

    const lineAdded = handler.execute('AddLineToTicket', { productId, quantity: 2 })
    expect(lineAdded.type).toBe('LineAddedToTicket')
    expect(lineAdded.payload.total).toBe(6.0)
  })

  it('throws on unknown action', () => {
    expect(() => handler.execute('UnknownAction', {}))
      .toThrow('Unknown action')
  })
})
