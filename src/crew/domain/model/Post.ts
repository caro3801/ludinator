import { PostName } from './PostName'
import { TimeSlot } from './TimeSlot'
import { ValidationError } from '../errors/ValidationError'
import { generateId } from '../../../shared/generateId'
import { PostId } from '../../../shared/types'

export class Post {
  #id: PostId
  #name: PostName
  #minVolunteers: number
  #slots: TimeSlot[]

  constructor(id: PostId, name: PostName, minVolunteers: number) {
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

  removeSlot(slotId: string): void {
    this.#slots = this.#slots.filter(s => s.id !== slotId)
  }

  updateSlotWindow(slotId: string, newWindow: unknown): TimeSlot {
    const slot = this.#slots.find(s => s.id === slotId)
    if (!slot) throw new ValidationError(`Slot not found: ${slotId}`)
    slot.updateWindow(newWindow)
    return slot
  }

  toJSON(): { id: PostId, name: string, minVolunteers: number, slots: unknown[] } {
    return {
      id: this.#id,
      name: this.#name.value,
      minVolunteers: this.#minVolunteers,
      slots: this.#slots.map(s => s.toJSON()),
    }
  }

  static fromJSON(data: { id: PostId, name: string, minVolunteers: number, slots: unknown[] }): Post {
    const post = new Post(data.id, new PostName(data.name), data.minVolunteers)
    post.#slots = data.slots.map(s => TimeSlot.fromJSON(s as any))
    return post
  }

  static create(rawName: string, minVolunteers: number): Post {
    const name = new PostName(rawName)
    if (!Number.isInteger(minVolunteers) || minVolunteers < 1) {
      throw new ValidationError('minVolunteers must be a positive integer')
    }
    return new Post(generateId(), name, minVolunteers)
  }
}
