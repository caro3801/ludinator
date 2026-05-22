import { describe, it, expect } from 'vitest'
import { DeleteSubCounterBatch } from './DeleteSubCounterBatch'
import { SubCounterBatchDeleted } from '../../domain/events'
import { EntryLog } from '../../domain/model/EntryLog'

describe('DeleteSubCounterBatch', () => {
  it('emits SubCounterBatchDeleted with batch removed', () => {
    const log = EntryLog.create('edition-2024')
    const sc = log.addSubCounter('Samedi')
    const batch = sc.addBatch({ adults: 2, children: 0, families: 0 })
    const batchId = batch.id
    const subCounterId = sc.id

    const event = new DeleteSubCounterBatch().execute({ entryLog: log.toJSON(), subCounterId, batchId })
    expect(event).toBeInstanceOf(SubCounterBatchDeleted)
    expect(event.payload.subCounters[0].batches).toHaveLength(0)
  })
})
