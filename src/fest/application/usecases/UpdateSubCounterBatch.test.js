import { describe, it, expect } from 'vitest'
import { UpdateSubCounterBatch } from './UpdateSubCounterBatch.js'
import { EntryLog } from '../../domain/model/EntryLog.js'

class InMemoryEntryLogRepository {
  #log = EntryLog.create('edition-2024')
  async findByEdition() { return this.#log }
  async save(log) { this.#log = log }
}

describe('UpdateSubCounterBatch', () => {
  it('updates a batch inside a sub-counter', async () => {
    const repo = new InMemoryEntryLogRepository()
    const log = await repo.findByEdition()
    const sc = log.addSubCounter('Samedi')
    const batch = sc.addBatch({ adults: 1, children: 0, families: 0 })
    await repo.save(log)

    await new UpdateSubCounterBatch(repo).execute({
      editionId: 'edition-2024', subCounterId: sc.id, batchId: batch.id, adults: 5, children: 3, families: 0,
    })
    const updated = await repo.findByEdition()
    expect(updated.findSubCounter(sc.id).totalAdults).toBe(5)
  })
})
