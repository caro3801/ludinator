import { ProductRepository } from '../../ports/ProductRepository.js'

export class InMemoryProductRepository extends ProductRepository {
  #store = new Map()

  async save(product) { this.#store.set(product.id, product) }
  async findById(id) { return this.#store.get(id) ?? null }
  async findAll() { return [...this.#store.values()] }
  async delete(id) { this.#store.delete(id) }
}
