import { ProductDeleted } from '../../domain/events.js'

export class DeleteProduct {
  execute({ productId }) {
    return new ProductDeleted({ productId })
  }
}
