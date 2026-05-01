import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateProduct } from './UpdateProduct.js'
import { InMemoryProductRepository } from '../../adapters/storage/InMemoryProductRepository.js'
import { Product } from '../../domain/model/Product.js'

describe('UpdateProduct', () => {
  let repo, useCase, product

  beforeEach(async () => {
    repo = new InMemoryProductRepository()
    useCase = new UpdateProduct(repo)
    product = Product.create('Crêpe', 2.50)
    await repo.save(product)
  })

  it('updates name only — price stays unchanged', async () => {
    const updated = await useCase.execute({ id: product.id, name: 'Gaufre' })
    expect(updated.name.value).toBe('Gaufre')
    expect(updated.price.value).toBe(2.50)
    expect((await repo.findById(product.id)).name.value).toBe('Gaufre')
  })

  it('updates price only — name stays unchanged', async () => {
    const updated = await useCase.execute({ id: product.id, price: 3.00 })
    expect(updated.name.value).toBe('Crêpe')
    expect(updated.price.value).toBe(3.00)
    expect((await repo.findById(product.id)).price.value).toBe(3.00)
  })

  it('updates both name and price', async () => {
    const updated = await useCase.execute({ id: product.id, name: 'Gaufre', price: 3.00 })
    expect(updated.name.value).toBe('Gaufre')
    expect(updated.price.value).toBe(3.00)
  })

  it('throws Error when product is not found', async () => {
    await expect(useCase.execute({ id: 'unknown-id', name: 'Gaufre' }))
      .rejects.toThrow('Product not found: unknown-id')
  })
})
