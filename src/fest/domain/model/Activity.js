import { ActivityName } from './ActivityName.js'
import { TimeSlot } from './TimeSlot.js'
import { ValidationError } from '../errors/ValidationError.js'
import { generateId } from '../../../shared/generateId.js'

export class Activity {
  #id
  #name
  #location
  #slots

  constructor(id, name, location = null) {
    this.#id = id
    this.#name = name
    this.#location = location
    this.#slots = []
  }

  get id() { return this.#id }
  get name() { return this.#name }
  get location() { return this.#location }
  get slots() { return [...this.#slots] }

  updateName(raw) { this.#name = new ActivityName(raw) }

  addSlot(window, { min = null, max = null } = {}) {
    const slot = TimeSlot.create(this.#id, window, { min, max })
    this.#slots.push(slot)
    return slot
  }

  removeSlot(slotId) {
    this.#slots = this.#slots.filter(s => s.id !== slotId)
  }

  findSlot(slotId) {
    const slot = this.#slots.find(s => s.id === slotId)
    if (!slot) throw new ValidationError(`Slot not found: ${slotId}`)
    return slot
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name.value,
      location: this.#location,
      slots: this.#slots.map(s => s.toJSON()),
    }
  }

  static fromJSON({ id, name, location, slots }) {
    const activity = new Activity(id, new ActivityName(name), location)
    activity.#slots = slots.map(s => TimeSlot.fromJSON(s))
    return activity
  }

  static create(rawName, location = null) {
    return new Activity(generateId(), new ActivityName(rawName), location)
  }
}
