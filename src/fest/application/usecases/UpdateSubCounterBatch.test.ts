import { describe, it, expect } from 'vitest'
import { UpdateSubCounterBatch } from './UpdateSubCounterBatch'
import { SubCounterBatchUpdated } from '../../domain/events'
import { EntryLog } from '../../domain/model/EntryLog'

describe('UpdateSubCounterBatch', () => {
  it('emits SubCounterBatchUpdated with updated batch', () => {
    const log = EntryLog.create('edition-2024')
    const sc = log.addSubCounter('Samedi')
    const batch = sc.addBatch({ adults: 1, children: 0, families: 0 })
    const batchId = batch.id
    const subCounterId = sc.id

    const event = new UpdateSubCounterBatch().execute({ entryLog: log.toJSON(), subCounterId, batchId, adults: 5, children: 3, families: 0 })
    expect(event).toBeInstanceOf(SubCounterBatchUpdated)
    const batches = event.payload.subCounters[0].batches
    expect(batches[0].adults).toBe(5)
  })
})
