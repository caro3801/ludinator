import { describe, it, expect } from 'vitest'
import { RecordSubCounterEntries } from './RecordSubCounterEntries'
import { EntriesRecorded } from '../../domain/events'
import { EntryLog } from '../../domain/model/EntryLog'
import type { EntryLogData } from '../../domain/model/EntryLog'

describe('RecordSubCounterEntries', () => {
  it('emits EntriesRecorded with batch added to sub-counter', () => {
    const log = EntryLog.create('edition-2024')
    log.addSubCounter('Samedi')
    const entryLog = log.toJSON() as EntryLogData
    const subCounterId = entryLog.subCounters[0].id

    const event = new RecordSubCounterEntries().execute({ entryLog, subCounterId, adults: 4, children: 2, families: 0 })
    expect(event).toBeInstanceOf(EntriesRecorded)
    expect((event.payload as { subCounters: { batches: { adults: number }[] }[] }).subCounters[0].batches).toHaveLength(1)
    expect((event.payload as { subCounters: { batches: { adults: number }[] }[] }).subCounters[0].batches[0].adults).toBe(4)
  })
})
