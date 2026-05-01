import { ValidationError } from '../errors/ValidationError.js'

export class PostName {
  #value

  constructor(value) {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('Post name must not be empty')
    }
    this.#value = value.trim()
  }

  get value() {
    return this.#value
  }
}
