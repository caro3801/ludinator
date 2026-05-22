import { describe, it, expect } from 'vitest'
import { CreateProduct } from './CreateProduct'
import { ProductCreated } from '../../domain/events'

describe('CreateProduct', () => {
  it('emits ProductCreated with correct data', () => {
    const event = new CreateProduct().execute({ name: 'Bière', price: 3.5, category: 'Boissons' })
    expect(event).toBeInstanceOf(ProductCreated)
    expect(event.payload.name).toBe('Bière')
    expect(event.payload.price).toBe(3.5)
    expect(event.payload.category).toBe('Boissons')
  })

  it('throws ValidationError when name is empty', () => {
    expect(() => new CreateProduct().execute({ name: '', price: 3.5, category: 'Boissons' }))
      .toThrow()
  })

  it('throws ValidationError when price is invalid', () => {
    expect(() => new CreateProduct().execute({ name: 'Bière', price: NaN, category: 'Boissons' }))
      .toThrow()
  })
})
