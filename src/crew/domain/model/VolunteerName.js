import { ValidationError } from '../errors/ValidationError.js'

export class VolunteerName {
  #value

  constructor(value) {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('Volunteer name must not be empty')
    }
    this.#value = value.trim()
  }

  get value() {
    return this.#value
  }
}
