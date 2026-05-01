import { describe, it, expect } from 'vitest'
import { RemoveSubCounter } from './RemoveSubCounter.js'
import { EntryLog } from '../../domain/model/EntryLog.js'

class InMemoryEntryLogRepository {
  #log = EntryLog.create('edition-2024')
  async findByEdition() { return this.#log }
  async save(log) { this.#log = log }
}

describe('RemoveSubCounter', () => {
  it('removes a sub-counter from the log', async () => {
    const repo = new InMemoryEntryLogRepository()
    const log = await repo.findByEdition()
    const sc = log.addSubCounter('Samedi')
    await repo.save(log)
    await new RemoveSubCounter(repo).execute({ editionId: 'edition-2024', subCounterId: sc.id })
    expect((await repo.findByEdition()).subCounters).toHaveLength(0)
  })
})
