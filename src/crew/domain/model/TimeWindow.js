import { ValidationError } from '../errors/ValidationError.js'

export class TimeWindow {
  #day
  #startTime
  #endTime

  constructor(day, startTime, endTime) {
    if (startTime >= endTime) {
      throw new ValidationError('startTime must be before endTime')
    }
    this.#day = day
    this.#startTime = startTime
    this.#endTime = endTime
  }

  get day() { return this.#day }
  get startTime() { return this.#startTime }
  get endTime() { return this.#endTime }

  get durationHours() {
    const toMinutes = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    return (toMinutes(this.#endTime) - toMinutes(this.#startTime)) / 60
  }

  overlaps(other) {
    return this.#day === other.day
      && this.#startTime < other.endTime
      && this.#endTime > other.startTime
  }

  toJSON() {
    return { day: this.#day, startTime: this.#startTime, endTime: this.#endTime }
  }

  static fromJSON({ day, startTime, endTime }) {
    return new TimeWindow(day, startTime, endTime)
  }
}
