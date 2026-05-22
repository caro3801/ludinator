import { ProductRepository } from '../../ports/ProductRepository'
import { Product } from '../../domain/model/Product'

/**
 * In-memory implementation of ProductRepository
 */
export class InMemoryProductRepository implements ProductRepository {
  #store = new Map<string, Product>()

  async save(product: Product): Promise<void> {
    this.#store.set(product.id, product)
  }

  async findById(id: string): Promise<Product | null> {
    return this.#store.get(id) ?? null
  }

  async findAll(): Promise<Product[]> {
    return [...this.#store.values()]
  }

  async delete(id: string): Promise<void> {
    this.#store.delete(id)
  }
}
