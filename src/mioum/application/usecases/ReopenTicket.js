export class ReopenTicket {
  #repo

  constructor(ticketRepository) {
    this.#repo = ticketRepository
  }

  async execute({ ticketId }) {
    const ticket = await this.#repo.findById(ticketId)
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`)
    ticket.reopen()
    await this.#repo.save(ticket)
    return ticket
  }
}
