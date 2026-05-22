import { Volunteer } from '../../domain/model/Volunteer'
import { VolunteerCreated } from '../../domain/events'

export class CreateVolunteer {
  execute({ name }) {
    const volunteer = Volunteer.create(name)
    return new VolunteerCreated({ volunteer: volunteer.toJSON() })
  }
}
