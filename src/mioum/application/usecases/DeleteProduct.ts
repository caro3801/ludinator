import { ProductDeleted } from '../../domain/events'
import { ProductId } from '../../../shared/types'

interface DeleteProductParams {
  productId: ProductId
}

export class DeleteProduct {
  execute({ productId }: DeleteProductParams): ProductDeleted {
    return new ProductDeleted({ productId })
  }
}
