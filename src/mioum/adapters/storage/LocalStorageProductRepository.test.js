// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageProductRepository } from './LocalStorageProductRepository.js'
import { Product } from '../../domain/model/Product.js'

describe('LocalStorageProductRepository', () => {
  let repo

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageProductRepository()
  })

  it('saves and retrieves a product by id', async () => {
    const product = Product.create('Bière', 2.5)
    await repo.save(product)

    const found = await repo.findById(product.id)
    expect(found.id).toBe(product.id)
    expect(found.name.value).toBe('Bière')
    expect(found.price.value).toBe(2.5)
  })

  it('returns all saved products', async () => {
    await repo.save(Product.create('Bière', 2.5))
    await repo.save(Product.create('Jus de pomme', 1.5))

    const all = await repo.findAll()
    expect(all).toHaveLength(2)
  })

  it('deletes a product so it is no longer findable', async () => {
    const product = Product.create('Bière', 2.5)
    await repo.save(product)
    await repo.delete(product.id)

    expect(await repo.findById(product.id)).toBeNull()
  })

  it('returns null when product is not found', async () => {
    expect(await repo.findById('unknown')).toBeNull()
  })
})
