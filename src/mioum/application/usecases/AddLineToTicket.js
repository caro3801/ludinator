export class AddLineToTicket {
  #ticketRepo
  #productRepo

  constructor(ticketRepository, productRepository) {
    this.#ticketRepo = ticketRepository
    this.#productRepo = productRepository
  }

  async execute({ ticketId, productId, quantity }) {
    const ticket = await this.#ticketRepo.findById(ticketId)
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`)

    const product = await this.#productRepo.findById(productId)
    if (!product) throw new Error(`Product not found: ${productId}`)

    const line = ticket.addLine(product.id, product.name.value, product.price.value, quantity)
    await this.#ticketRepo.save(ticket)
    return line
  }
}
