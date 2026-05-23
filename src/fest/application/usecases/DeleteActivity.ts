import { ActivityDeleted } from '../../domain/events'
import { ActivityId } from '../../../shared/types'

interface DeleteActivityParams {
  activityId: ActivityId
}

export class DeleteActivity {
  execute({ activityId }: DeleteActivityParams): ActivityDeleted {
    return new ActivityDeleted({ activityId })
  }
}
