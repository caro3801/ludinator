import { VolunteerRepository } from '../../ports/VolunteerRepository'
import { Volunteer } from '../../domain/model/Volunteer'

const KEY = 'crew:volunteers'

export class LocalStorageVolunteerRepository implements VolunteerRepository {
  #read() {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  }

  #write(data) {
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  async save(volunteer) {
    const data = this.#read()
    data[volunteer.id] = volunteer.toJSON()
    this.#write(data)
  }

  async findById(id) {
    const data = this.#read()
    return data[id] ? Volunteer.fromJSON(data[id]) : null
  }

  async findAll() {
    return Object.values(this.#read()).map(v => Volunteer.fromJSON(v))
  }

  async delete(id) {
    const data = this.#read()
    delete data[id]
    this.#write(data)
  }
}
