import { Activity } from '../domain/model/Activity'

/**
 * Port interface for activity persistence
 */
export interface ActivityRepository {
  save(activity: Activity): Promise<void>
  findById(id: string): Promise<Activity | null>
  findAll(): Promise<Activity[]>
  delete(id: string): Promise<void>
}
