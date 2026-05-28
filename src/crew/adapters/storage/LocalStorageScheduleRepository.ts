import { ScheduleRepository } from '../../ports/ScheduleRepository'
import { Schedule } from '../../domain/model/Schedule'
import { EditionId, ScheduleId } from '../../../shared/types'

const KEY = 'crew:schedules'

interface ScheduleData {
  id: ScheduleId
  editionId: EditionId
  assignments: unknown[]
}

export class LocalStorageScheduleRepository implements ScheduleRepository {
  #read(): Record<EditionId, ScheduleData> {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  }

  #write(data: Record<EditionId, ScheduleData>): void {
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  async save(schedule: Schedule): Promise<void> {
    const data = this.#read()
    data[schedule.editionId as EditionId] = schedule.toJSON() as ScheduleData
    this.#write(data)
  }

  async findById(id: ScheduleId): Promise<Schedule | null> {
    const data = this.#read()
    // Note: findById searches by schedule id, not editionId
    // Since we store by editionId, we need to search through all values
    for (const scheduleData of Object.values(data)) {
      if (scheduleData.id === id) {
        return Schedule.fromJSON(scheduleData)
      }
    }
    return null
  }

  async findByEdition(editionId: EditionId): Promise<Schedule | null> {
    const data = this.#read()
    return data[editionId] ? Schedule.fromJSON(data[editionId]) : null
  }

  async findAll(): Promise<Schedule[]> {
    const data = this.#read()
    return Object.values(data).map((d: ScheduleData) => Schedule.fromJSON(d))
  }

  async delete(id: ScheduleId): Promise<void> {
    const data = this.#read()
    // Need to find the editionId that contains this schedule id
    for (const [editionId, scheduleData] of Object.entries(data)) {
      if (scheduleData.id === id) {
        delete data[editionId as EditionId]
        break
      }
    }
    this.#write(data)
  }
}
