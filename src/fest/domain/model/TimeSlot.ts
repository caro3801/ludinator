import { ValidationError } from '../errors/ValidationError'
import { TimeWindow } from './TimeWindow'
import { Registration } from './Registration'
import { generateId } from '../../../shared/generateId'
import { FestSlotId, ActivityId, RegistrationId } from '../../../shared/types'

export class TimeSlot {
  #id: FestSlotId
  #activityId: ActivityId
  #window: TimeWindow
  #minParticipants: number | null
  #maxParticipants: number | null
  #registrations: Registration[]

  constructor(id: FestSlotId, activityId: ActivityId, window: TimeWindow, { min = null, max = null } = {}) {
    this.#id = id
    this.#activityId = activityId
    this.#window = window
    this.#minParticipants = min
    this.#maxParticipants = max
    this.#registrations = []
  }

  get id(): FestSlotId { return this.#id }
  get activityId(): ActivityId { return this.#activityId }
  get window(): TimeWindow { return this.#window }
  get minParticipants(): number | null { return this.#minParticipants }
  get maxParticipants(): number | null { return this.#maxParticipants }
  get registrations(): Registration[] { return [...this.#registrations] }
  get registrationCount(): number { return this.#registrations.length }
  get isOverCapacity(): boolean { return this.#registrations.some(r => r.waitlisted) }
  get isUnderstaffed(): boolean { return this.#minParticipants !== null && this.registrationCount < this.#minParticipants }

  addRegistration(name: string): Registration {
    const waitlisted = this.#maxParticipants !== null && this.registrationCount >= this.#maxParticipants
    const reg = Registration.create(this.#id, name, { waitlisted })
    this.#registrations.push(reg)
    return reg
  }

  updateRegistration(id: RegistrationId, name: string): void {
    const reg = this.#registrations.find(r => r.id === id)
    if (!reg) throw new ValidationError(`Registration not found: ${id}`)
    reg.updateName(name)
  }

  removeRegistration(id: RegistrationId): void {
    this.#registrations = this.#registrations.filter(r => r.id !== id)
  }

  toJSON(): {
    id: FestSlotId,
    activityId: ActivityId,
    window: { day: string, startTime: string, endTime: string },
    minParticipants: number | null,
    maxParticipants: number | null,
    registrations: unknown[]
  } {
    return {
      id: this.#id,
      activityId: this.#activityId,
      window: this.#window.toJSON(),
      minParticipants: this.#minParticipants,
      maxParticipants: this.#maxParticipants,
      registrations: this.#registrations.map(r => r.toJSON()),
    }
  }

  static fromJSON(data: {
    id: FestSlotId,
    activityId: ActivityId,
    window: { day: string, startTime: string, endTime: string },
    minParticipants: number | null,
    maxParticipants: number | null,
    registrations: unknown[]
  }): TimeSlot {
    const slot = new TimeSlot(
      data.id,
      data.activityId,
      TimeWindow.fromJSON(data.window),
      {
        min: data.minParticipants,
        max: data.maxParticipants,
      }
    )
    slot.#registrations = (data.registrations ?? []).map(r => Registration.fromJSON(r as any))
    return slot
  }

  static create(activityId: ActivityId, window: TimeWindow, opts = {}): TimeSlot {
    return new TimeSlot(generateId() as FestSlotId, activityId, window, opts)
  }
}
