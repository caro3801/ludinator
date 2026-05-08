import { VolunteerDeleted } from '../../domain/events.js'

export class DeleteVolunteer {
  execute({ volunteerId }) {
    return new VolunteerDeleted({ volunteerId })
  }
}
