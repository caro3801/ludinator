import { ActivityDeleted } from '../../domain/events.js'

export class DeleteActivity {
  execute({ activityId }) {
    return new ActivityDeleted({ activityId })
  }
}
