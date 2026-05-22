import { Product } from '../../domain/model/Product'
import { ProductUpdated } from '../../domain/events'

export class UpdateProduct {
  execute({ product: productData, name, price, category }) {
    const product = Product.fromJSON(productData)
    product.update({ name, price, category })
    return new ProductUpdated({ product: product.toJSON() })
  }
}
