import { Schedule } from '../domain/model/Schedule'

/**
 * Port interface for schedule persistence
 */
export interface ScheduleRepository {
  save(schedule: Schedule): Promise<void>
  findById(id: string): Promise<Schedule | null>
  findByEdition(editionId: string): Promise<Schedule | null>
  findAll(): Promise<Schedule[]>
  delete(id: string): Promise<void>
}
