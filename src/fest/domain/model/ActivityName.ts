import { ValidationError } from '../errors/ValidationError'

export class ActivityName {
  #value: string

  constructor(raw?: string) {
    const trimmed = raw?.trim() ?? ''
    if (!trimmed) throw new ValidationError('ActivityName cannot be empty')
    this.#value = trimmed
  }

  get value(): string { return this.#value }
}
