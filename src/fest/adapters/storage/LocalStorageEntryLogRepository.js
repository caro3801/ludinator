import { EntryLog } from '../../domain/model/EntryLog.js'

const KEY = 'fest:entry-logs'

export class LocalStorageEntryLogRepository {
  #load() {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
  }

  #save(store) { localStorage.setItem(KEY, JSON.stringify(store)) }

  async findByEdition(editionId) {
    const data = this.#load()[editionId]
    return data ? EntryLog.fromJSON(data) : null
  }

  async save(log) {
    const store = this.#load()
    store[log.editionId] = log.toJSON()
    this.#save(store)
  }
}
