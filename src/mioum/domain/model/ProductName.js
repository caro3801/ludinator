import { ValidationError } from '../errors/ValidationError.js'

export class ProductName {
  #value

  constructor(raw) {
    const v = raw?.trim() ?? ''
    if (!v) throw new ValidationError('ProductName cannot be empty')
    this.#value = v
  }

  get value() {
    return this.#value
  }
}
