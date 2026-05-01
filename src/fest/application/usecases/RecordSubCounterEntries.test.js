import { describe, it, expect } from 'vitest'
import { RecordSubCounterEntries } from './RecordSubCounterEntries.js'
import { EntryLog } from '../../domain/model/EntryLog.js'

class InMemoryEntryLogRepository {
  #log = EntryLog.create('edition-2024')
  async findByEdition() { return this.#log }
  async save(log) { this.#log = log }
}

describe('RecordSubCounterEntries', () => {
  it('adds a batch to the named sub-counter', async () => {
    const repo = new InMemoryEntryLogRepository()
    const log = await repo.findByEdition()
    const sc = log.addSubCounter('Samedi')
    await repo.save(log)

    const batch = await new RecordSubCounterEntries(repo).execute({
      editionId: 'edition-2024', subCounterId: sc.id, adults: 4, children: 2, families: 0,
    })
    expect(batch.adults).toBe(4)
    const updated = await repo.findByEdition()
    expect(updated.findSubCounter(sc.id).totalAdults).toBe(4)
  })
})
