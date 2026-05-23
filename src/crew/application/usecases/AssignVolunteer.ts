import { Volunteer } from '../../domain/model/Volunteer'
import { TimeSlot } from '../../domain/model/TimeSlot'
import { Schedule } from '../../domain/model/Schedule'
import { VolunteerAssigned } from '../../domain/events'
import { EditionId, VolunteerId, SlotId, PostId } from '../../../shared/types'

interface AssignVolunteerParams {
  volunteer: { id: VolunteerId, name: string }
  slot: { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } }
  schedule: { id: string, editionId: EditionId, assignments: { id: string, volunteerId: VolunteerId, slotId: SlotId }[], conflicts?: { volunteerId: VolunteerId, slotIdA: SlotId, slotIdB: SlotId }[] } | null
  editionId: EditionId
}

export class AssignVolunteer {
  execute({ volunteer: volunteerData, slot: slotData, schedule: scheduleData, editionId }: AssignVolunteerParams): VolunteerAssigned {
    const volunteer = Volunteer.fromJSON(volunteerData)
    const slot = TimeSlot.fromJSON(slotData)
    const schedule = scheduleData ? Schedule.fromJSON(scheduleData) : Schedule.create(editionId)
    schedule.assign(volunteer, slot)
    return new VolunteerAssigned({ schedule: schedule.toJSON() })
  }
}
