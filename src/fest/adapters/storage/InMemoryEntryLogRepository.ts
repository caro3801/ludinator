import { EntryLogRepository } from '../../ports/EntryLogRepository'
import { EntryLog } from '../../domain/model/EntryLog'

/**
 * In-memory implementation of EntryLogRepository
 * Useful for testing and client-side state management
 */
export class InMemoryEntryLogRepository implements EntryLogRepository {
  #store = new Map<string, EntryLog>()

  async findByEdition(editionId: string): Promise<EntryLog | null> {
    return this.#store.get(editionId) ?? null
  }

  async save(log: EntryLog): Promise<void> {
    this.#store.set(log.editionId, log)
  }
}
