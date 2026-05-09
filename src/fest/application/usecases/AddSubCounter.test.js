import { describe, it, expect } from 'vitest'
import { AddSubCounter } from './AddSubCounter.js'
import { SubCounterAdded } from '../../domain/events.js'
import { EntryLog } from '../../domain/model/EntryLog.js'

describe('AddSubCounter', () => {
  it('emits SubCounterAdded with new sub-counter', () => {
    const entryLog = EntryLog.create('edition-2024').toJSON()
    const event = new AddSubCounter().execute({ entryLog, label: 'Samedi', editionId: 'edition-2024' })
    expect(event).toBeInstanceOf(SubCounterAdded)
    expect(event.payload.subCounters).toHaveLength(1)
    expect(event.payload.subCounters[0].label).toBe('Samedi')
  })

  it('creates a new log when none exists yet', () => {
    const event = new AddSubCounter().execute({ entryLog: null, label: 'Dimanche', editionId: 'edition-2024' })
    expect(event).toBeInstanceOf(SubCounterAdded)
    expect(event.payload.editionId).toBe('edition-2024')
    expect(event.payload.subCounters).toHaveLength(1)
  })
})
