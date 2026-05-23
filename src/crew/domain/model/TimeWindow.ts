import { ValidationError } from '../errors/ValidationError'

export class TimeWindow {
  #day: string
  #startTime: string
  #endTime: string

  constructor(day: string, startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new ValidationError('startTime must be before endTime')
    }
    this.#day = day
    this.#startTime = startTime
    this.#endTime = endTime
  }

  get day(): string { return this.#day }
  get startTime(): string { return this.#startTime }
  get endTime(): string { return this.#endTime }

  get durationHours(): number {
    const toMinutes = (t: string): number => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    return (toMinutes(this.#endTime) - toMinutes(this.#startTime)) / 60
  }

  overlaps(other: TimeWindow): boolean {
    return this.#day === other.day
      && this.#startTime < other.endTime
      && this.#endTime > other.startTime
  }

  toJSON(): { day: string, startTime: string, endTime: string } {
    return { day: this.#day, startTime: this.#startTime, endTime: this.#endTime }
  }

  static fromJSON(data: { day: string, startTime: string, endTime: string }): TimeWindow {
    return new TimeWindow(data.day, data.startTime, data.endTime)
  }
}
