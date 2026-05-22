import { describe, it, expect } from 'vitest'
import { UpdateProduct } from './UpdateProduct'
import { ProductUpdated } from '../../domain/events'
import { Product } from '../../domain/model/Product'

describe('UpdateProduct', () => {
  it('emits ProductUpdated with new values', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const event = new UpdateProduct().execute({ product: product.toJSON(), name: 'Bière pression', price: 4.0, category: 'Boissons' })
    expect(event).toBeInstanceOf(ProductUpdated)
    expect(event.payload.name).toBe('Bière pression')
    expect(event.payload.price).toBe(4.0)
  })

  it('throws when name is empty', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    expect(() => new UpdateProduct().execute({ product: product.toJSON(), name: '', price: 3.0, category: 'Boissons' }))
      .toThrow()
  })
})
