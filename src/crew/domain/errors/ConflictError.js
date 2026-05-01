export class ConflictError extends Error {
  constructor(volunteerId, window) {
    super(`Volunteer ${volunteerId} already has a slot overlapping ${window.day} ${window.startTime}-${window.endTime}`)
    this.name = 'ConflictError'
  }
}
