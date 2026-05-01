export class RemoveLineFromTicket {
  #ticketRepo

  constructor(ticketRepository) {
    this.#ticketRepo = ticketRepository
  }

  async execute({ ticketId, lineId }) {
    const ticket = await this.#ticketRepo.findById(ticketId)
    if (!ticket) throw new Error(`Ticket not found: ${ticketId}`)
    ticket.removeLine(lineId)
    await this.#ticketRepo.save(ticket)
  }
}
