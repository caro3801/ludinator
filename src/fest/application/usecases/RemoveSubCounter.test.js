import { describe, it, expect } from 'vitest'
import { RemoveSubCounter } from './RemoveSubCounter.js'
import { SubCounterRemoved } from '../../domain/events.js'
import { EntryLog } from '../../domain/model/EntryLog.js'

describe('RemoveSubCounter', () => {
  it('emits SubCounterRemoved with sub-counter removed', () => {
    const log = EntryLog.create('edition-2024')
    log.addSubCounter('Samedi')
    const subCounterId = log.toJSON().subCounters[0].id

    const event = new RemoveSubCounter().execute({ entryLog: log.toJSON(), subCounterId })
    expect(event).toBeInstanceOf(SubCounterRemoved)
    expect(event.payload.subCounters).toHaveLength(0)
  })
})
