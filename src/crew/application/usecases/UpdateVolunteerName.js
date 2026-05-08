import { Volunteer } from '../../domain/model/Volunteer.js'
import { VolunteerNameUpdated } from '../../domain/events.js'

export class UpdateVolunteerName {
  execute({ volunteer: volunteerData, name }) {
    const volunteer = Volunteer.fromJSON(volunteerData)
    volunteer.updateName(name)
    return new VolunteerNameUpdated({ volunteer: volunteer.toJSON() })
  }
}
