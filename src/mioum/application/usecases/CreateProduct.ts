import { Product } from '../../domain/model/Product'
import { ProductCreated } from '../../domain/events'

interface CreateProductParams {
  name: string
  price: number
  category: string
}

export class CreateProduct {
  execute({ name, price, category }: CreateProductParams): ProductCreated {
    const product = Product.create(name, price, category)
    return new ProductCreated({ product })
  }
}
