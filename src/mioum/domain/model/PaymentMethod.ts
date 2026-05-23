import { ValidationError } from '../errors/ValidationError'

const VALID_METHODS = ['cash', 'card', 'other'] as const
export type PaymentMethodValue = typeof VALID_METHODS[number]

export class PaymentMethod {
  #value: PaymentMethodValue

  constructor(raw: string) {
    if (!VALID_METHODS.includes(raw as PaymentMethodValue)) {
      throw new ValidationError(
        `PaymentMethod must be one of: ${VALID_METHODS.join(', ')}`
      )
    }
    this.#value = raw as PaymentMethodValue
  }

  get value(): PaymentMethodValue {
    return this.#value
  }
}
