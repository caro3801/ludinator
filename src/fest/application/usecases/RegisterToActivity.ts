import { Activity } from '../../domain/model/Activity'
import { RegistrationAdded } from '../../domain/events'
import { ActivityId, FestSlotId } from '../../../shared/types'

interface RegisterToActivityParams {
  activity: { id: ActivityId, name: string, location: string | null, slots: unknown[] }
  slotId: FestSlotId
  personName: string
}

export class RegisterToActivity {
  execute({ activity: activityData, slotId, personName }: RegisterToActivityParams): RegistrationAdded {
    const activity = Activity.fromJSON(activityData)
    activity.findSlot(slotId).addRegistration(personName)
    return new RegistrationAdded({ activity: activity.toJSON() })
  }
}
