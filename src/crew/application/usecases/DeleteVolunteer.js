export class DeleteVolunteer {
  #volunteerRepo
  #scheduleRepo

  constructor(volunteerRepository, scheduleRepository) {
    this.#volunteerRepo = volunteerRepository
    this.#scheduleRepo = scheduleRepository
  }

  async execute({ volunteerId, editionId }) {
    const volunteer = await this.#volunteerRepo.findById(volunteerId)
    if (!volunteer) throw new Error(`Volunteer not found: ${volunteerId}`)

    if (editionId) {
      const schedule = await this.#scheduleRepo.findByEdition(editionId)
      if (schedule) {
        schedule.removeAssignmentsForVolunteer(volunteerId)
        await this.#scheduleRepo.save(schedule)
      }
    }

    await this.#volunteerRepo.delete(volunteerId)
  }
}
