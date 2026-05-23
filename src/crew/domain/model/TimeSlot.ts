import { TimeWindow } from './TimeWindow'
import { generateId } from '../../../shared/generateId'
import { PostId, SlotId } from '../../../shared/types'

export class TimeSlot {
  #id: SlotId
  #postId: PostId
  #window: TimeWindow

  constructor(id: SlotId, postId: PostId, window: TimeWindow) {
    this.#id = id
    this.#postId = postId
    this.#window = window
  }

  get id(): SlotId { return this.#id }
  get postId(): PostId { return this.#postId }
  get window(): TimeWindow { return this.#window }

  updateWindow(newWindow: TimeWindow): void {
    this.#window = newWindow
  }

  toJSON(): { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } } {
    return { id: this.#id, postId: this.#postId, window: this.#window.toJSON() }
  }

  static fromJSON(data: { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } }): TimeSlot {
    return new TimeSlot(data.id, data.postId, TimeWindow.fromJSON(data.window))
  }

  static create(postId: PostId, window: TimeWindow): TimeSlot {
    return new TimeSlot(generateId() as SlotId, postId, window)
  }
}
