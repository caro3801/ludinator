import { TimeWindow } from './TimeWindow.js'
import { generateId } from '../../../shared/generateId.js'

export class Assignment {
  #id
  #volunteerId
  #slotId
  #window

  constructor(id, volunteerId, slotId, window) {
    this.#id = id
    this.#volunteerId = volunteerId
    this.#slotId = slotId
    this.#window = window
  }

  get id() { return this.#id }
  get volunteerId() { return this.#volunteerId }
  get slotId() { return this.#slotId }
  get window() { return this.#window }

  toJSON() {
    return {
      id: this.#id,
      volunteerId: this.#volunteerId,
      slotId: this.#slotId,
      window: this.#window.toJSON(),
    }
  }

  static fromJSON({ id, volunteerId, slotId, window }) {
    return new Assignment(id, volunteerId, slotId, TimeWindow.fromJSON(window))
  }

  static create(volunteerId, slotId, window) {
    return new Assignment(generateId(), volunteerId, slotId, window)
  }
}
