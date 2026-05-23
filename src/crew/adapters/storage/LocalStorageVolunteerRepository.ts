import { VolunteerRepository } from '../../ports/VolunteerRepository'
import { Volunteer } from '../../domain/model/Volunteer'
import { VolunteerId } from '../../../shared/types'

const KEY = 'crew:volunteers'

interface VolunteerData {
  id: VolunteerId
  name: string
}

export class LocalStorageVolunteerRepository implements VolunteerRepository {
  #read(): Record<VolunteerId, VolunteerData> {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  }

  #write(data: Record<VolunteerId, VolunteerData>): void {
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  async save(volunteer: Volunteer): Promise<void> {
    const data = this.#read()
    data[volunteer.id as VolunteerId] = volunteer.toJSON() as VolunteerData
    this.#write(data)
  }

  async findById(id: VolunteerId): Promise<Volunteer | null> {
    const data = this.#read()
    return data[id] ? Volunteer.fromJSON(data[id]) : null
  }

  async findAll(): Promise<Volunteer[]> {
    return Object.values(this.#read()).map((v: VolunteerData) => Volunteer.fromJSON(v))
  }

  async delete(id: VolunteerId): Promise<void> {
    const data = this.#read()
    delete data[id]
    this.#write(data)
  }
}
