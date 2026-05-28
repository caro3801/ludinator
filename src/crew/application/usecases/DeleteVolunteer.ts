import { VolunteerDeleted } from '../../domain/events'
import { VolunteerId } from '../../../shared/types'

interface DeleteVolunteerParams {
  volunteerId: VolunteerId
}

export class DeleteVolunteer {
  execute({ volunteerId }: DeleteVolunteerParams): VolunteerDeleted {
    return new VolunteerDeleted({ volunteerId })
  }
}
