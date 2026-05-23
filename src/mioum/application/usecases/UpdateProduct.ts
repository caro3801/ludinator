import { Product } from '../../domain/model/Product'
import { ProductUpdated } from '../../domain/events'
import { ProductId } from '../../../shared/types'

interface UpdateProductParams {
  product: { id: ProductId, name: string, price: number, category: string }
  name: string
  price: number
  category: string
}

export class UpdateProduct {
  execute({ product: productData, name, price, category }: UpdateProductParams): ProductUpdated {
    const product = Product.fromJSON(productData)
    product.update({ name, price, category })
    return new ProductUpdated({ product: product.toJSON() })
  }
}
