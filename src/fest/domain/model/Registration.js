import { ValidationError } from '../errors/ValidationError.js'
import { generateId } from '../../../shared/generateId.js'

export class Registration {
  #id
  #slotId
  #personName
  #waitlisted

  constructor(id, slotId, personName, waitlisted = false) {
    this.#id = id
    this.#slotId = slotId
    this.#personName = personName
    this.#waitlisted = waitlisted
  }

  get id() { return this.#id }
  get slotId() { return this.#slotId }
  get personName() { return this.#personName }
  get waitlisted() { return this.#waitlisted }

  updateName(name) {
    const trimmed = name?.trim() ?? ''
    if (!trimmed) throw new ValidationError('Registration name cannot be empty')
    this.#personName = trimmed
  }

  toJSON() { return { id: this.#id, slotId: this.#slotId, personName: this.#personName, waitlisted: this.#waitlisted } }
  static fromJSON({ id, slotId, personName, waitlisted = false }) { return new Registration(id, slotId, personName, waitlisted) }

  static create(slotId, name, { waitlisted = false } = {}) {
    const trimmed = name?.trim() ?? ''
    if (!trimmed) throw new ValidationError('Registration name cannot be empty')
    return new Registration(generateId(), slotId, trimmed, waitlisted)
  }
}
