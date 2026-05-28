import { describe, it, expect } from 'vitest'
import { AddSubCounter } from './AddSubCounter'
import { SubCounterAdded } from '../../domain/events'
import { EntryLog } from '../../domain/model/EntryLog'
import type { EntryLogData } from '../../domain/model/EntryLog'

describe('AddSubCounter', () => {
  it('emits SubCounterAdded with new sub-counter', () => {
    const entryLog = EntryLog.create('edition-2024').toJSON() as EntryLogData
    const event = new AddSubCounter().execute({ entryLog, label: 'Samedi', editionId: 'edition-2024' })
    expect(event).toBeInstanceOf(SubCounterAdded)
    expect((event.payload as { subCounters: { label: string }[] }).subCounters).toHaveLength(1)
    expect((event.payload as { subCounters: { label: string }[] }).subCounters[0].label).toBe('Samedi')
  })

  it('creates a new log when none exists yet', () => {
    const event = new AddSubCounter().execute({ entryLog: null, label: 'Dimanche', editionId: 'edition-2024' })
    expect(event).toBeInstanceOf(SubCounterAdded)
    expect((event.payload as { editionId: string }).editionId).toBe('edition-2024')
    expect((event.payload as { subCounters: unknown[] }).subCounters).toHaveLength(1)
  })
})
