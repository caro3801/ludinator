import { ScheduleRepository } from '../../ports/ScheduleRepository'
import { Schedule } from '../../domain/model/Schedule'

const KEY = 'crew:schedules'

export class LocalStorageScheduleRepository implements ScheduleRepository {
  #read() {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  }

  #write(data) {
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  async save(schedule) {
    const data = this.#read()
    data[schedule.editionId] = schedule.toJSON()
    this.#write(data)
  }

  async findByEdition(editionId) {
    const data = this.#read()
    return data[editionId] ? Schedule.fromJSON(data[editionId]) : null
  }
}
