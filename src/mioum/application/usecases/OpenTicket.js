import { Ticket } from '../../domain/model/Ticket.js'

export class OpenTicket {
  #ticketRepo

  constructor(ticketRepository) {
    this.#ticketRepo = ticketRepository
  }

  async execute() {
    const ticket = Ticket.create()
    await this.#ticketRepo.save(ticket)
    return ticket
  }
}
