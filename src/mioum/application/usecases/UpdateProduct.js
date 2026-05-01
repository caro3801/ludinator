export class UpdateProduct {
  #repo

  constructor(productRepository) {
    this.#repo = productRepository
  }

  async execute({ id, name, price }) {
    const product = await this.#repo.findById(id)
    if (!product) throw new Error(`Product not found: ${id}`)
    product.update({ name, price })
    await this.#repo.save(product)
    return product
  }
}
