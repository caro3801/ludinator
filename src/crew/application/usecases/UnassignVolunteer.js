export class UnassignVolunteer {
  #scheduleRepo

  constructor(scheduleRepository) {
    this.#scheduleRepo = scheduleRepository
  }

  async execute({ assignmentId, editionId }) {
    const schedule = await this.#scheduleRepo.findByEdition(editionId)
    if (!schedule) throw new Error(`Schedule not found for edition: ${editionId}`)
    schedule.removeAssignment(assignmentId)
    await this.#scheduleRepo.save(schedule)
  }
}
