import { Volunteer } from '../../domain/model/Volunteer'
import { VolunteerCreated } from '../../domain/events'

interface CreateVolunteerParams {
  name: string
}

export class CreateVolunteer {
  execute({ name }: CreateVolunteerParams): VolunteerCreated {
    const volunteer = Volunteer.create(name)
    return new VolunteerCreated({ volunteer: volunteer.toJSON() })
  }
}
