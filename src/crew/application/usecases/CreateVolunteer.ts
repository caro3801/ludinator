import { Volunteer } from '../../domain/model/Volunteer'
import { VolunteerCreated } from '../../domain/events'
import { VolunteerRepository } from '../../ports/VolunteerRepository'

interface CreateVolunteerParams {
  name: string
}

export class VolunteerAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Un bénévole avec le nom "${name}" existe déjà.`)
    this.name = 'VolunteerAlreadyExistsError'
  }
}

export class CreateVolunteer {
  #volunteerRepo: VolunteerRepository

  constructor(volunteerRepo: VolunteerRepository) {
    this.#volunteerRepo = volunteerRepo
  }

  async execute({ name }: CreateVolunteerParams): Promise<VolunteerCreated> {
    const existingVolunteers = await this.#volunteerRepo.findAll()
    const nameLower = name.toLowerCase()
    const exists = existingVolunteers.some(v => v.name.value.toLowerCase() === nameLower)
    if (exists) {
      throw new VolunteerAlreadyExistsError(name)
    }
    const volunteer = Volunteer.create(name)
    return new VolunteerCreated({ volunteer: volunteer.toJSON() })
  }
}
