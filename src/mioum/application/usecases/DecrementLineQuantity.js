export class DecrementLineQuantity {
  #repo

  constructor(ticketRepository) {
    this.#repo = ticketRepository
  }

  async execute({ ticketId, lineId }) {
    const ticket = await this.#repo.findById(ticketId)
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`)
    ticket.decrementLine(lineId)
    await this.#repo.save(ticket)
    return ticket
  }
}
