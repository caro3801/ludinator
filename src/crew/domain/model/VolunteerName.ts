import { ValidationError } from '../errors/ValidationError'

export class VolunteerName {
  #value: string

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('Volunteer name must not be empty')
    }
    this.#value = value.trim()
  }

  get value(): string {
    return this.#value
  }
}
