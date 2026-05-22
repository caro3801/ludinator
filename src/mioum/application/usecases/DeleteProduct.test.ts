import { describe, it, expect } from 'vitest'
import { DeleteProduct } from './DeleteProduct'
import { ProductDeleted } from '../../domain/events'

describe('DeleteProduct', () => {
  it('emits ProductDeleted with correct productId', () => {
    const event = new DeleteProduct().execute({ productId: 'abc-123' })
    expect(event).toBeInstanceOf(ProductDeleted)
    expect(event.payload.productId).toBe('abc-123')
  })
})
