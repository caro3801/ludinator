import { ValidationError } from '../errors/ValidationError'

export class ProductName {
  #value: string

  constructor(raw: string | undefined | null) {
    const v = raw?.trim() ?? ''
    if (!v) throw new ValidationError('ProductName cannot be empty')
    this.#value = v
  }

  get value(): string {
    return this.#value
  }
}
