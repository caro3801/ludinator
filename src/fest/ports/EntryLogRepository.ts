import { EntryLog } from '../domain/model/EntryLog'

/**
 * Port interface for entry log persistence
 */
export interface EntryLogRepository {
  save(log: EntryLog): Promise<void>
  findByEdition(editionId: string): Promise<EntryLog | null>
}
