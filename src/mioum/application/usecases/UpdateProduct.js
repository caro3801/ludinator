export class UpdateProduct {
  #repo

  constructor(productRepository) {
    this.#repo = productRepository
  }

  async execute({ id, name, price, category }) {
    const product = await this.#repo.findById(id)
    if (!product) throw new Error(`Product not found: ${id}`)
    product.update({ name, price, category })
    await this.#repo.save(product)
    return product
  }
}
