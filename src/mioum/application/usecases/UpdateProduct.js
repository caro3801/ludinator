import { Product } from '../../domain/model/Product.js'
import { ProductUpdated } from '../../domain/events.js'

export class UpdateProduct {
  execute({ product: productData, name, price, category }) {
    const product = Product.fromJSON(productData)
    product.update({ name, price, category })
    return new ProductUpdated({ product: product.toJSON() })
  }
}
