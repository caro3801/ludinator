import { Volunteer } from '../../domain/model/Volunteer'
import { VolunteerNameUpdated } from '../../domain/events'
import { VolunteerId } from '../../../shared/types'

interface UpdateVolunteerNameParams {
  volunteer: { id: VolunteerId, name: string }
  name: string
}

export class UpdateVolunteerName {
  execute({ volunteer: volunteerData, name }: UpdateVolunteerNameParams): VolunteerNameUpdated {
    const volunteer = Volunteer.fromJSON(volunteerData)
    volunteer.updateName(name)
    return new VolunteerNameUpdated({ volunteer: volunteer.toJSON() })
  }
}
