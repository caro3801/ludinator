import { VolunteerName } from './VolunteerName'
import { generateId } from '../../../shared/generateId'
import { VolunteerId } from '../../../shared/types'

export class Volunteer {
  #id: VolunteerId
  #name: VolunteerName

  constructor(id: VolunteerId, name: VolunteerName) {
    this.#id = id
    this.#name = name
  }

  get id(): VolunteerId { return this.#id }
  get name(): VolunteerName { return this.#name }

  updateName(rawName: string): void {
    this.#name = new VolunteerName(rawName)
  }

  toJSON(): { id: VolunteerId, name: string } {
    return { id: this.#id, name: this.#name.value }
  }

  static fromJSON(data: { id: VolunteerId, name: string }): Volunteer {
    return new Volunteer(data.id, new VolunteerName(data.name))
  }

  static create(rawName: string): Volunteer {
    return new Volunteer(generateId() as VolunteerId, new VolunteerName(rawName))
  }
}
