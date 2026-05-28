import { describe, it, expect } from 'vitest'
import { RemoveSubCounter } from './RemoveSubCounter'
import { SubCounterRemoved } from '../../domain/events'
import { EntryLog } from '../../domain/model/EntryLog'
import type { EntryLogData } from '../../domain/model/EntryLog'

describe('RemoveSubCounter', () => {
  it('emits SubCounterRemoved with sub-counter removed', () => {
    const log = EntryLog.create('edition-2024')
    log.addSubCounter('Samedi')
    const entryLog = log.toJSON() as EntryLogData
    const subCounterId = entryLog.subCounters[0].id

    const event = new RemoveSubCounter().execute({ entryLog, subCounterId })
    expect(event).toBeInstanceOf(SubCounterRemoved)
    expect((event.payload as { subCounters: unknown[] }).subCounters).toHaveLength(0)
  })
})
