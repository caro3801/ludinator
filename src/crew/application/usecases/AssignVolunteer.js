import { Schedule } from '../../domain/model/Schedule.js'

export class AssignVolunteer {
  #volunteers
  #posts
  #schedules

  constructor(volunteerRepository, postRepository, scheduleRepository) {
    this.#volunteers = volunteerRepository
    this.#posts = postRepository
    this.#schedules = scheduleRepository
  }

  async execute({ volunteerId, slotId, editionId }) {
    const volunteer = await this.#volunteers.findById(volunteerId)
    if (!volunteer) throw new Error(`Volunteer not found: ${volunteerId}`)

    const slot = await this.#posts.findSlotById(slotId)
    if (!slot) throw new Error(`Slot not found: ${slotId}`)

    let schedule = await this.#schedules.findByEdition(editionId)
    if (!schedule) schedule = Schedule.create(editionId)

    const assignment = schedule.assign(volunteer, slot)
    await this.#schedules.save(schedule)
    return assignment
  }
}
