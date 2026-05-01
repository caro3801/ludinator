import { ValidationError } from '../errors/ValidationError.js'

export class Price {
  #value

  constructor(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError('Price must be a number')
    }

    this.#value = value
  }

  static create(value) {
    return new Price(value)
  }

  get value() {
    return this.#value
  }
}
