export class CloseTicket {
  #ticketRepo

  constructor(ticketRepository) {
    this.#ticketRepo = ticketRepository
  }

  async execute({ ticketId, paymentMethod = null }) {
    const ticket = await this.#ticketRepo.findById(ticketId)
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`)
    ticket.close(paymentMethod)
    await this.#ticketRepo.save(ticket)
    return ticket
  }
}
