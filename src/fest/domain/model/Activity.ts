import { ActivityName } from './ActivityName'
import { TimeSlot } from './TimeSlot'
import { ValidationError } from '../errors/ValidationError'
import { generateId } from '../../../shared/generateId'
import { ActivityId, SlotId } from "../../../shared/types";
import {TimeWindow} from "./TimeWindow";

export class Activity {
  #id: ActivityId
  #name: ActivityName
  #location: string | null
  #slots: TimeSlot[]

  constructor(id: ActivityId, name: ActivityName, location: string | null = null) {
    this.#id = id
    this.#name = name
    this.#location = location
    this.#slots = []
  }

  get id(): ActivityId { return this.#id }
  get name(): ActivityName { return this.#name }
  get location(): string | null { return this.#location }
  get slots(): TimeSlot[] { return [...this.#slots] }

  updateName(raw: string): void { this.#name = new ActivityName(raw) }

  addSlot(window: TimeWindow, { min = null, max = null }: { min?: number | null, max?: number | null } = {}): TimeSlot {
    const slot = TimeSlot.create(this.#id, window, { min, max })
    this.#slots.push(slot)
    return slot
  }

  removeSlot(slotId: SlotId): void {
    this.#slots = this.#slots.filter(s => s.id !== slotId)
  }

  findSlot(slotId: SlotId): TimeSlot {
    const slot = this.#slots.find(s => s.id === slotId)
    if (!slot) throw new ValidationError(`Slot not found: ${slotId}`)
    return slot
  }

  toJSON(): { id: ActivityId, name: string, location: string | null, slots: unknown[] } {
    return {
      id: this.#id,
      name: this.#name.value,
      location: this.#location,
      slots: this.#slots.map(s => s.toJSON()),
    }
  }

  static fromJSON(data: { id: ActivityId, name: string, location: string | null, slots: unknown[] }): Activity {
    const activity = new Activity(data.id, new ActivityName(data.name), data.location)
    activity.#slots = data.slots.map(s => TimeSlot.fromJSON(s as any))
    return activity
  }

  static create(rawName: string, location: string | null = null): Activity {
    return new Activity(generateId() as ActivityId, new ActivityName(rawName), location)
  }
}
