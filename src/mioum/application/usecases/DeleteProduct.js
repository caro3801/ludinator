export class DeleteProduct {
  #repo

  constructor(productRepository) {
    this.#repo = productRepository
  }

  async execute({ id }) {
    await this.#repo.delete(id)
  }
}
