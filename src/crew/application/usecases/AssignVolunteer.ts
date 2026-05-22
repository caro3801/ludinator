import { Volunteer } from '../../domain/model/Volunteer'
import { TimeSlot } from '../../domain/model/TimeSlot'
import { Schedule } from '../../domain/model/Schedule'
import { VolunteerAssigned } from '../../domain/events'

export class AssignVolunteer {
  execute({ volunteer: volunteerData, slot: slotData, schedule: scheduleData, editionId }) {
    const volunteer = Volunteer.fromJSON(volunteerData)
    const slot = TimeSlot.fromJSON(slotData)
    const schedule = scheduleData ? Schedule.fromJSON(scheduleData) : Schedule.create(editionId)
    schedule.assign(volunteer, slot)
    return new VolunteerAssigned({ schedule: schedule.toJSON() })
  }
}
