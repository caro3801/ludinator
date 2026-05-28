import { EntryLog } from '../../domain/model/EntryLog'
import {EditionId} from "../../../shared/types";

const KEY = 'fest:entry-logs'

export class LocalStorageEntryLogRepository {
  #load() {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
  }

  #save(store: Record<string, unknown>): void { localStorage.setItem(KEY, JSON.stringify(store)) }

  async findByEdition(editionId:EditionId) {
    const data = this.#load()[editionId]
    return data ? EntryLog.fromJSON(data) : null
  }

  async save(log: EntryLog): Promise<void> {
    const store = this.#load()
    store[log.editionId] = log.toJSON()
    this.#save(store)
  }
}
