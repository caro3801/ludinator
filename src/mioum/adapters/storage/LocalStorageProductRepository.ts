import { ProductRepository } from '../../ports/ProductRepository'
import { Product } from '../../domain/model/Product'

const KEY = 'mioum:products'

/**
 * LocalStorage implementation of ProductRepository
 */
export class LocalStorageProductRepository implements ProductRepository {
  #read(): Record<string, unknown> {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  }

  #write(data: Record<string, unknown>): void {
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  async save(product: Product): Promise<void> {
    const data = this.#read()
    data[product.id] = product.toJSON()
    this.#write(data)
  }

  async findById(id: string): Promise<Product | null> {
    const data = this.#read()
    const raw = data[id]
    if (!raw || typeof raw !== 'object') return null
    return Product.fromJSON(raw as { id: string; name: string; price: number; category: string })
  }

  async findAll(): Promise<Product[]> {
    const data = this.#read()
    const values = Object.values(data)
    return values.map((p: unknown) => {
      if (p && typeof p === 'object') {
        return Product.fromJSON(p as { id: string; name: string; price: number; category: string })
      }
      throw new Error('Invalid product data in storage')
    })
  }

  async delete(id: string): Promise<void> {
    const data = this.#read()
    delete data[id]
    this.#write(data)
  }
}
