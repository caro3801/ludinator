import { ValidationError } from '../errors/ValidationError.js'
import { TimeWindow } from './TimeWindow.js'
import { Registration } from './Registration.js'
import { generateId } from '../../../shared/generateId.js'

export class TimeSlot {
  #id
  #activityId
  #window
  #minParticipants
  #maxParticipants
  #registrations

  constructor(id, activityId, window, { min = null, max = null } = {}) {
    this.#id = id
    this.#activityId = activityId
    this.#window = window
    this.#minParticipants = min
    this.#maxParticipants = max
    this.#registrations = []
  }

  get id() { return this.#id }
  get activityId() { return this.#activityId }
  get window() { return this.#window }
  get minParticipants() { return this.#minParticipants }
  get maxParticipants() { return this.#maxParticipants }
  get registrations() { return [...this.#registrations] }
  get registrationCount() { return this.#registrations.length }
  get isOverCapacity() { return this.#registrations.some(r => r.waitlisted) }
  get isUnderstaffed() { return this.#minParticipants !== null && this.registrationCount < this.#minParticipants }

  addRegistration(name) {
    const waitlisted = this.#maxParticipants !== null && this.registrationCount >= this.#maxParticipants
    const reg = Registration.create(this.#id, name, { waitlisted })
    this.#registrations.push(reg)
    return reg
  }

  updateRegistration(id, name) {
    const reg = this.#registrations.find(r => r.id === id)
    if (!reg) throw new ValidationError(`Registration not found: ${id}`)
    reg.updateName(name)
  }

  removeRegistration(id) {
    this.#registrations = this.#registrations.filter(r => r.id !== id)
  }

  toJSON() {
    return {
      id: this.#id,
      activityId: this.#activityId,
      window: this.#window.toJSON(),
      minParticipants: this.#minParticipants,
      maxParticipants: this.#maxParticipants,
      registrations: this.#registrations.map(r => r.toJSON()),
    }
  }

  static fromJSON(data) {
    const slot = new TimeSlot(data.id, data.activityId, TimeWindow.fromJSON(data.window), {
      min: data.minParticipants,
      max: data.maxParticipants,
    })
    slot.#registrations = (data.registrations ?? []).map(r => Registration.fromJSON(r))
    return slot
  }

  static create(activityId, window, opts = {}) {
    return new TimeSlot(generateId(), activityId, window, opts)
  }
}
