import { PostName } from './PostName.js'
import { TimeSlot } from './TimeSlot.js'
import { ValidationError } from '../errors/ValidationError.js'
import { generateId } from '../../../shared/generateId.js'

export class Post {
  #id
  #name
  #minVolunteers
  #slots

  constructor(id, name, minVolunteers) {
    this.#id = id
    this.#name = name
    this.#minVolunteers = minVolunteers
    this.#slots = []
  }

  get id() { return this.#id }
  get name() { return this.#name }
  get minVolunteers() { return this.#minVolunteers }
  get slots() { return [...this.#slots] }

  updateName(rawName) {
    this.#name = new PostName(rawName)
  }

  addSlot(window) {
    const slot = TimeSlot.create(this.#id, window)
    this.#slots.push(slot)
    return slot
  }

  removeSlot(slotId) {
    this.#slots = this.#slots.filter(s => s.id !== slotId)
  }

  updateSlotWindow(slotId, newWindow) {
    const slot = this.#slots.find(s => s.id === slotId)
    if (!slot) throw new ValidationError(`Slot not found: ${slotId}`)
    slot.updateWindow(newWindow)
    return slot
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name.value,
      minVolunteers: this.#minVolunteers,
      slots: this.#slots.map(s => s.toJSON()),
    }
  }

  static fromJSON({ id, name, minVolunteers, slots }) {
    const post = new Post(id, new PostName(name), minVolunteers)
    post.#slots = slots.map(s => TimeSlot.fromJSON(s))
    return post
  }

  static create(rawName, minVolunteers) {
    const name = new PostName(rawName)
    if (!Number.isInteger(minVolunteers) || minVolunteers < 1) {
      throw new ValidationError('minVolunteers must be a positive integer')
    }
    return new Post(generateId(), name, minVolunteers)
  }
}
