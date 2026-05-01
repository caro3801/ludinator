import { TimeWindow } from './TimeWindow.js'
import { generateId } from '../../../shared/generateId.js'

export class TimeSlot {
  #id
  #postId
  #window

  constructor(id, postId, window) {
    this.#id = id
    this.#postId = postId
    this.#window = window
  }

  get id() { return this.#id }
  get postId() { return this.#postId }
  get window() { return this.#window }

  updateWindow(newWindow) {
    this.#window = newWindow
  }

  toJSON() {
    return { id: this.#id, postId: this.#postId, window: this.#window.toJSON() }
  }

  static fromJSON({ id, postId, window }) {
    return new TimeSlot(id, postId, TimeWindow.fromJSON(window))
  }

  static create(postId, window) {
    return new TimeSlot(generateId(), postId, window)
  }
}
