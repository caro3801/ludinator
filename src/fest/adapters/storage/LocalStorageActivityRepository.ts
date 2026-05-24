import { Activity } from '../../domain/model/Activity'
import {ActivityId} from "../../../shared/types";

const KEY = 'fest:activities'

export class LocalStorageActivityRepository {
  #load() {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
  }

  #save(store: Record<string, unknown>): void { localStorage.setItem(KEY, JSON.stringify(store)) }

  async save(activity:Activity) {
    const store = this.#load()
    store[activity.id] = activity.toJSON()
    this.#save(store)
  }

  async findById(id:ActivityId) {
    const data = this.#load()[id]
    return data ? Activity.fromJSON(data) : null
  }

  async findAll() {
    return Object.values(this.#load()).map(d => Activity.fromJSON(d as Parameters<typeof Activity.fromJSON>[0]))
  }

  async delete(id:ActivityId) {
    const store = this.#load()
    delete store[id]
    this.#save(store)
  }
}
