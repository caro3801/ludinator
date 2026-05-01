export class CancelTicket {
  #ticketRepo

  constructor(ticketRepository) {
    this.#ticketRepo = ticketRepository
  }

  async execute({ ticketId }) {
    const ticket = await this.#ticketRepo.findById(ticketId)
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`)
    ticket.cancel()
    await this.#ticketRepo.save(ticket)
    return ticket
  }
}
