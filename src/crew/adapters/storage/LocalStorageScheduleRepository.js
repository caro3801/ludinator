import { ScheduleRepository } from '../../ports/ScheduleRepository.js'
import { Schedule } from '../../domain/model/Schedule.js'

const KEY = 'crew:schedules'

export class LocalStorageScheduleRepository extends ScheduleRepository {
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
