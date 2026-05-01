import { TicketRepository } from '../../ports/TicketRepository.js'
import { Ticket } from '../../domain/model/Ticket.js'

const KEY = 'mioum:tickets'

export class LocalStorageTicketRepository extends TicketRepository {
  #read() { return JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  #write(data) { localStorage.setItem(KEY, JSON.stringify(data)) }

  async save(ticket) {
    const data = this.#read()
    data[ticket.id] = ticket.toJSON()
    this.#write(data)
  }
  async findById(id) {
    const data = this.#read()
    return data[id] ? Ticket.fromJSON(data[id]) : null
  }
  async findAll() {
    return Object.values(this.#read()).map(t => Ticket.fromJSON(t))
  }
  async findByStatus(status) {
    return Object.values(this.#read())
      .map(t => Ticket.fromJSON(t))
      .filter(t => t.status === status)
  }
  async delete(id) {
    const data = this.#read()
    delete data[id]
    this.#write(data)
  }
}
