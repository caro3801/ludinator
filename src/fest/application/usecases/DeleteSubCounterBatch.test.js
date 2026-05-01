import { describe, it, expect } from 'vitest'
import { DeleteSubCounterBatch } from './DeleteSubCounterBatch.js'
import { EntryLog } from '../../domain/model/EntryLog.js'

class InMemoryEntryLogRepository {
  #log = EntryLog.create('edition-2024')
  async findByEdition() { return this.#log }
  async save(log) { this.#log = log }
}

describe('DeleteSubCounterBatch', () => {
  it('removes a batch from a sub-counter', async () => {
    const repo = new InMemoryEntryLogRepository()
    const log = await repo.findByEdition()
    const sc = log.addSubCounter('Samedi')
    const batch = sc.addBatch({ adults: 2, children: 0, families: 0 })
    await repo.save(log)

    await new DeleteSubCounterBatch(repo).execute({
      editionId: 'edition-2024', subCounterId: sc.id, batchId: batch.id,
    })
    const updated = await repo.findByEdition()
    expect(updated.findSubCounter(sc.id).batches).toHaveLength(0)
  })
})
