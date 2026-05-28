import { Activity } from '../../domain/model/Activity'
import { ActivityCreated } from '../../domain/events'

interface CreateActivityParams {
  name: string
  location?: string | null
}

export class CreateActivity {
  execute({ name, location = null }: CreateActivityParams): ActivityCreated {
    const activity = Activity.create(name, location)
    return new ActivityCreated({ activity: activity.toJSON() })
  }
}
