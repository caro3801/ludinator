import { ProductDeleted } from '../../domain/events'

export class DeleteProduct {
  execute({ productId }) {
    return new ProductDeleted({ productId })
  }
}
