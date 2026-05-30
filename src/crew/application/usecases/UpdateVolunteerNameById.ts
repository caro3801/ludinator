import { VolunteerRepository } from '../../ports/VolunteerRepository'
import { Volunteer } from '../../domain/model/Volunteer'
import { VolunteerNameUpdated } from '../../domain/events'
import { VolunteerId } from '../../../shared/types'
import { VolunteerAlreadyExistsError } from './CreateVolunteer'

interface UpdateVolunteerNameByIdParams {
  volunteerId: VolunteerId
  name: string
}

export { VolunteerAlreadyExistsError }

export class UpdateVolunteerNameById {
  constructor(private volunteerRepo: VolunteerRepository) {}

  async execute({ volunteerId, name }: UpdateVolunteerNameByIdParams): Promise<VolunteerNameUpdated> {
    const volunteer = await this.volunteerRepo.findById(volunteerId)
    if (!volunteer) {
      throw new Error('Volunteer not found')
    }
    
    // Check if another volunteer already has this name (case insensitive)
    const allVolunteers = await this.volunteerRepo.findAll()
    const nameLower = name.toLowerCase()
    const existingWithSameName = allVolunteers.some(
      v => v.id !== volunteerId && v.name.value.toLowerCase() === nameLower
    )
    if (existingWithSameName) {
      throw new VolunteerAlreadyExistsError(name)
    }
    
    volunteer.updateName(name)
    await this.volunteerRepo.save(volunteer)
    return new VolunteerNameUpdated({ volunteer: volunteer.toJSON() })
  }
}
