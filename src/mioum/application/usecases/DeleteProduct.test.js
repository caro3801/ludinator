import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteProduct } from './DeleteProduct.js'
import { InMemoryProductRepository } from '../../adapters/storage/InMemoryProductRepository.js'
import { Product } from '../../domain/model/Product.js'

describe('DeleteProduct', () => {
  let repo, useCase, product

  beforeEach(async () => {
    repo = new InMemoryProductRepository()
    useCase = new DeleteProduct(repo)
    product = Product.create('Crêpe', 2.50, 'Snacks')
    await repo.save(product)
  })

  it('deletes an existing product — no longer findable', async () => {
    await useCase.execute({ id: product.id })
    expect(await repo.findById(product.id)).toBeNull()
  })

  it('is idempotent — deleting a non-existent product does not throw', async () => {
    await expect(useCase.execute({ id: 'non-existent-id' })).resolves.not.toThrow()
  })
})
