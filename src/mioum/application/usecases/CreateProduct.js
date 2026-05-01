import { Product } from '../../domain/model/Product.js'

export class CreateProduct {
  #repo

  constructor(productRepository) {
    this.#repo = productRepository
  }

  async execute({ name, price }) {
    const product = Product.create(name, price)
    await this.#repo.save(product)
    return product
  }
}
