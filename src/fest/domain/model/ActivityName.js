import { ValidationError } from '../errors/ValidationError.js'

export class ActivityName {
  #value

  constructor(raw) {
    const trimmed = raw?.trim() ?? ''
    if (!trimmed) throw new ValidationError('ActivityName cannot be empty')
    this.#value = trimmed
  }

  get value() { return this.#value }
}
