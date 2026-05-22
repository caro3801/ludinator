import { Volunteer } from '../../domain/model/Volunteer'
import { VolunteerNameUpdated } from '../../domain/events'

export class UpdateVolunteerName {
  execute({ volunteer: volunteerData, name }) {
    const volunteer = Volunteer.fromJSON(volunteerData)
    volunteer.updateName(name)
    return new VolunteerNameUpdated({ volunteer: volunteer.toJSON() })
  }
}
