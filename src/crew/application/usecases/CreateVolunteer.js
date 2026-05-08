import { Volunteer } from '../../domain/model/Volunteer.js'
import { VolunteerCreated } from '../../domain/events.js'

export class CreateVolunteer {
  execute({ name }) {
    const volunteer = Volunteer.create(name)
    return new VolunteerCreated({ volunteer: volunteer.toJSON() })
  }
}
