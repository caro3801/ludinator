import { VolunteerDeleted } from '../../domain/events'

export class DeleteVolunteer {
  execute({ volunteerId }) {
    return new VolunteerDeleted({ volunteerId })
  }
}
