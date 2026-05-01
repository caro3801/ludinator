import { ValidationError } from '../errors/ValidationError.js'

const VALID_METHODS = ['cash', 'card', 'other']

export class PaymentMethod {
  #value

  constructor(raw) {
    if (!VALID_METHODS.includes(raw)) {
      throw new ValidationError(
        `PaymentMethod must be one of: ${VALID_METHODS.join(', ')}`
      )
    }
    this.#value = raw
  }

  get value() {
    return this.#value
  }
}
