import { Volunteer } from '../../domain/model/Volunteer.js'
import { TimeSlot } from '../../domain/model/TimeSlot.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { VolunteerAssigned } from '../../domain/events.js'

export class AssignVolunteer {
  execute({ volunteer: volunteerData, slot: slotData, schedule: scheduleData, editionId }) {
    const volunteer = Volunteer.fromJSON(volunteerData)
    const slot = TimeSlot.fromJSON(slotData)
    const schedule = scheduleData ? Schedule.fromJSON(scheduleData) : Schedule.create(editionId)
    schedule.assign(volunteer, slot)
    return new VolunteerAssigned({ schedule: schedule.toJSON() })
  }
}
