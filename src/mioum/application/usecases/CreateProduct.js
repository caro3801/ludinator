import { Product } from '../../domain/model/Product.js'
import { ProductCreated } from '../../domain/events.js'

export class CreateProduct {
  execute({ name, price, category }) {
    const product = Product.create(name, price, category)
    return new ProductCreated({ product: product.toJSON() })
  }
}
