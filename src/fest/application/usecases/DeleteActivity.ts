import { ActivityDeleted } from '../../domain/events'

export class DeleteActivity {
  execute({ activityId }) {
    return new ActivityDeleted({ activityId })
  }
}
