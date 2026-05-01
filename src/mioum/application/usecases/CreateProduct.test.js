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

  it('creates and persists a product with correct name, price and category', async () => {
    const product = await useCase.execute({ name: 'Crêpe', price: 2.50, category: 'Snacks' })
    expect(product.name.value).toBe('Crêpe')
    expect(product.price.value).toBe(2.50)
    expect(product.category).toBe('Snacks')
    expect(await repo.findById(product.id)).toBe(product)
  })

  it('throws ValidationError when name is empty', async () => {
    await expect(useCase.execute({ name: '', price: 2.50, category: 'Snacks' })).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError when category is empty', async () => {
    await expect(useCase.execute({ name: 'Crêpe', price: 2.50, category: '' })).rejects.toThrow(ValidationError)
  })

  it('creates a product with a negative price (retour / remise)', async () => {
    const product = await useCase.execute({ name: 'Retour consigne', price: -1, category: 'Consigne' })
    expect(product.price.value).toBe(-1)
  })
})
