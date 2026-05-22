import { Schedule } from '../../domain/model/Schedule'
import { VolunteerUnassigned } from '../../domain/events'

export class UnassignVolunteer {
  execute({ schedule: scheduleData, assignmentId }) {
    const schedule = Schedule.fromJSON(scheduleData)
    schedule.removeAssignment(assignmentId)
    return new VolunteerUnassigned({ schedule: schedule.toJSON() })
  }
}
