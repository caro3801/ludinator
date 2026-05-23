import { TimeWindow } from './TimeWindow'
import { generateId } from '../../../shared/generateId'

export class Assignment {
  #id: string
  #volunteerId: string
  #slotId: string
  #window: TimeWindow

  constructor(id: string, volunteerId: string, slotId: string, window: TimeWindow) {
    this.#id = id
    this.#volunteerId = volunteerId
    this.#slotId = slotId
    this.#window = window
  }

  get id(): string { return this.#id }
  get volunteerId(): string { return this.#volunteerId }
  get slotId(): string { return this.#slotId }
  get window(): TimeWindow { return this.#window }

  toJSON(): { id: string, volunteerId: string, slotId: string, window: unknown } {
    return {
      id: this.#id,
      volunteerId: this.#volunteerId,
      slotId: this.#slotId,
      window: this.#window.toJSON(),
    }
  }

  static fromJSON(data: { id: string, volunteerId: string, slotId: string, window: { day: string, startTime: string, endTime: string } }): Assignment {
    return new Assignment(data.id, data.volunteerId, data.slotId, TimeWindow.fromJSON(data.window))
  }

  static create(volunteerId: string, slotId: string, window: TimeWindow): Assignment {
    return new Assignment(generateId(), volunteerId, slotId, window)
  }
}
