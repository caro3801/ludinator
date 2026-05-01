import { VolunteerName } from './VolunteerName.js'
import { generateId } from '../../../shared/generateId.js'

export class Volunteer {
  #id
  #name

  constructor(id, name) {
    this.#id = id
    this.#name = name
  }

  get id() { return this.#id }
  get name() { return this.#name }

  updateName(rawName) {
    this.#name = new VolunteerName(rawName)
  }

  toJSON() {
    return { id: this.#id, name: this.#name.value }
  }

  static fromJSON({ id, name }) {
    return new Volunteer(id, new VolunteerName(name))
  }

  static create(rawName) {
    return new Volunteer(generateId(), new VolunteerName(rawName))
  }
}
