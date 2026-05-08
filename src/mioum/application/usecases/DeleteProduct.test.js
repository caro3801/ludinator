import { describe, it, expect } from 'vitest'
import { DeleteProduct } from './DeleteProduct.js'
import { ProductDeleted } from '../../domain/events.js'

describe('DeleteProduct', () => {
  it('emits ProductDeleted with correct productId', () => {
    const event = new DeleteProduct().execute({ productId: 'abc-123' })
    expect(event).toBeInstanceOf(ProductDeleted)
    expect(event.payload.productId).toBe('abc-123')
  })
})
