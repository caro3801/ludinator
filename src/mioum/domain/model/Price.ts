import { ValidationError } from '../errors/ValidationError'

export class Price {
  #value: number

  constructor(value: number) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError('Price must be a number')
    }
    this.#value = value
  }

  static create(value: number): Price {
    return new Price(value)
  }

  get value(): number {
    return this.#value
  }
}
