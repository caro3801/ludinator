import { describe, it, expect } from 'vitest'
import { AddSubCounter } from './AddSubCounter.js'
import { EntryLog } from '../../domain/model/EntryLog.js'

class InMemoryEntryLogRepository {
  #log = EntryLog.create('edition-2024')
  async findByEdition() { return this.#log }
  async save(log) { this.#log = log }
}

class EmptyEntryLogRepository {
  #log = null
  async findByEdition() { return this.#log }
  async save(log) { this.#log = log }
}

describe('AddSubCounter', () => {
  it('adds a sub-counter to the log and returns it', async () => {
    const repo = new InMemoryEntryLogRepository()
    const sc = await new AddSubCounter(repo).execute({ editionId: 'edition-2024', label: 'Samedi' })
    expect(sc.label).toBe('Samedi')
    expect(sc.id).toBeDefined()
    expect((await repo.findByEdition()).subCounters).toHaveLength(1)
  })

  it('creates a new log when none exists yet for the edition', async () => {
    const repo = new EmptyEntryLogRepository()
    const sc = await new AddSubCounter(repo).execute({ editionId: 'edition-2024', label: 'Dimanche' })
    expect(sc.label).toBe('Dimanche')
    const saved = await repo.findByEdition()
    expect(saved).not.toBeNull()
    expect(saved.editionId).toBe('edition-2024')
    expect(saved.subCounters).toHaveLength(1)
  })
})
