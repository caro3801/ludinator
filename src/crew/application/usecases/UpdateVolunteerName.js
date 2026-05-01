export class UpdateVolunteerName {
  #repo

  constructor(volunteerRepository) {
    this.#repo = volunteerRepository
  }

  async execute({ volunteerId, name }) {
    const volunteer = await this.#repo.findById(volunteerId)
    if (!volunteer) throw new Error(`Volunteer not found: ${volunteerId}`)
    volunteer.updateName(name)
    await this.#repo.save(volunteer)
    return volunteer
  }
}
