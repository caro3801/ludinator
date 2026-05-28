import { ValidationError } from '../errors/ValidationError'
import { generateId } from '../../../shared/generateId'
import { RegistrationId, FestSlotId } from '../../../shared/types'

export class Registration {
  #id: RegistrationId
  #slotId: FestSlotId
  #personName: string
  #waitlisted: boolean

  constructor(id: RegistrationId, slotId: FestSlotId, personName: string, waitlisted: boolean = false) {
    this.#id = id
    this.#slotId = slotId
    this.#personName = personName
    this.#waitlisted = waitlisted
  }

  get id(): RegistrationId { return this.#id }
  get slotId(): FestSlotId { return this.#slotId }
  get personName(): string { return this.#personName }
  get waitlisted(): boolean { return this.#waitlisted }

  updateName(name: string): void {
    const trimmed = name?.trim() ?? ''
    if (!trimmed) throw new ValidationError('Registration name cannot be empty')
    this.#personName = trimmed
  }

  toJSON(): { id: RegistrationId, slotId: FestSlotId, personName: string, waitlisted: boolean } {
    return { id: this.#id, slotId: this.#slotId, personName: this.#personName, waitlisted: this.#waitlisted }
  }

  static fromJSON(data: { id: RegistrationId, slotId: FestSlotId, personName: string, waitlisted?: boolean }): Registration {
    return new Registration(data.id, data.slotId, data.personName, data.waitlisted ?? false)
  }

  static create(slotId: FestSlotId, name: string, { waitlisted = false } = {}): Registration {
    const trimmed = name?.trim() ?? ''
    if (!trimmed) throw new ValidationError('Registration name cannot be empty')
    return new Registration(generateId() as RegistrationId, slotId, trimmed, waitlisted)
  }
}
