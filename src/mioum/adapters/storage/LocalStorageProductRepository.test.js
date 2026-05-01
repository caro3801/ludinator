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
    const product = Product.create('Bière', 2.5, 'Boissons')
    await repo.save(product)

    const found = await repo.findById(product.id)
    expect(found.id).toBe(product.id)
    expect(found.name.value).toBe('Bière')
    expect(found.price.value).toBe(2.5)
  })

  it('returns all saved products', async () => {
    await repo.save(Product.create('Bière', 2.5, 'Boissons'))
    await repo.save(Product.create('Jus de pomme', 1.5, 'Boissons'))

    const all = await repo.findAll()
    expect(all).toHaveLength(2)
  })

  it('deletes a product so it is no longer findable', async () => {
    const product = Product.create('Bière', 2.5, 'Boissons')
    await repo.save(product)
    await repo.delete(product.id)

    expect(await repo.findById(product.id)).toBeNull()
  })

  it('returns null when product is not found', async () => {
    expect(await repo.findById('unknown')).toBeNull()
  })

  it('overwrites a product on second save (same id)', async () => {
    const product = Product.create('Bière', 2.5, 'Boissons')
    await repo.save(product)
    product.update({ price: 3.0 })
    await repo.save(product)
    const all = await repo.findAll()
    expect(all).toHaveLength(1)
    expect(all[0].price.value).toBe(3.0)
  })

  it('persists across repository instances', async () => {
    const product = Product.create('Bière', 2.5, 'Boissons')
    await repo.save(product)
    const repo2 = new LocalStorageProductRepository()
    const found = await repo2.findById(product.id)
    expect(found.name.value).toBe('Bière')
  })
})
