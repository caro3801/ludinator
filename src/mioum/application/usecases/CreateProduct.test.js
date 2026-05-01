import { describe, it, expect, beforeEach } from 'vitest'
import { CreateProduct } from './CreateProduct.js'
import { InMemoryProductRepository } from '../../adapters/storage/InMemoryProductRepository.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'

describe('CreateProduct', () => {
  let repo, useCase

  beforeEach(() => {
    repo = new InMemoryProductRepository()
    useCase = new CreateProduct(repo)
  })

  it('creates and persists a product with correct name and price', async () => {
    const product = await useCase.execute({ name: 'Crêpe', price: 2.50 })
    expect(product.name.value).toBe('Crêpe')
    expect(product.price.value).toBe(2.50)
    expect(await repo.findById(product.id)).toBe(product)
  })

  it('throws ValidationError when name is empty', async () => {
    await expect(useCase.execute({ name: '', price: 2.50 })).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError when price is negative', async () => {
    await expect(useCase.execute({ name: 'x', price: -1 })).rejects.toThrow(ValidationError)
  })
})
