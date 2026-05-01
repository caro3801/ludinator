import { Activity } from '../../domain/model/Activity.js'

const KEY = 'fest:activities'

export class LocalStorageActivityRepository {
  #load() {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
  }

  #save(store) { localStorage.setItem(KEY, JSON.stringify(store)) }

  async save(activity) {
    const store = this.#load()
    store[activity.id] = activity.toJSON()
    this.#save(store)
  }

  async findById(id) {
    const data = this.#load()[id]
    return data ? Activity.fromJSON(data) : null
  }

  async findAll() {
    return Object.values(this.#load()).map(d => Activity.fromJSON(d))
  }

  async delete(id) {
    const store = this.#load()
    delete store[id]
    this.#save(store)
  }
}
