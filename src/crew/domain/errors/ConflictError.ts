import { VolunteerId } from '../../../shared/types'

interface TimeWindow {
  day: string
  startTime: string
  endTime: string
}

export class ConflictError extends Error {
  constructor(volunteerId: VolunteerId, window: TimeWindow) {
    super(`Volunteer ${volunteerId} already has a slot overlapping ${window.day} ${window.startTime}-${window.endTime}`)
    this.name = 'ConflictError'
  }
}
