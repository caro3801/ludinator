import { Schedule } from '../../domain/model/Schedule'
import { VolunteerUnassigned } from '../../domain/events'
import { EditionId, VolunteerId, SlotId } from '../../../shared/types'

interface UnassignVolunteerParams {
  schedule: { id: string, editionId: EditionId, assignments: { id: string, volunteerId: VolunteerId, slotId: SlotId }[], conflicts: { volunteerId: VolunteerId, slotIdA: SlotId, slotIdB: SlotId }[] }
  assignmentId: string
}

export class UnassignVolunteer {
  execute({ schedule: scheduleData, assignmentId }: UnassignVolunteerParams): VolunteerUnassigned {
    const schedule = Schedule.fromJSON(scheduleData)
    schedule.removeAssignment(assignmentId)
    return new VolunteerUnassigned({ schedule: schedule.toJSON() })
  }
}
