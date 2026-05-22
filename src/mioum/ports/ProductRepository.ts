import { Product } from '../domain/model/Product'

/**
 * Port interface for product persistence
 */
export interface ProductRepository {
  save(product: Product): Promise<void>
  findById(id: string): Promise<Product | null>
  findAll(): Promise<Product[]>
  delete(id: string): Promise<void>
}
