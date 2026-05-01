import { Volunteer } from '../../domain/model/Volunteer.js'

export class CreateVolunteer {
  #repo

  constructor(volunteerRepository) {
    this.#repo = volunteerRepository
  }

  async execute({ name }) {
    const volunteer = Volunteer.create(name)
    await this.#repo.save(volunteer)
    return volunteer
  }
}
