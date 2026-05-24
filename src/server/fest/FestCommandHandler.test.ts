import { describe, it, expect, beforeEach } from 'vitest'
import { FestCommandHandler } from './FestCommandHandler'
import { FestProjection } from './FestProjection'
import { EventStore } from '../EventStore'

describe('FestCommandHandler', () => {
  let store: EventStore
  let projection: FestProjection
  let handler: FestCommandHandler

  beforeEach(() => {
    store = new EventStore(':memory:')
    projection = new FestProjection(store)
    handler = new FestCommandHandler(projection)
  })

  it('CreateActivity returns ActivityCreated', () => {
    const event = handler.execute('CreateActivity', { name: 'Escape Game' })
    expect(event.type).toBe('ActivityCreated')
    expect((event.payload as { name: string }).name).toBe('Escape Game')
  })

  it('UpdateActivityName throws when activity not found', () => {
    expect(() => handler.execute('UpdateActivityName', { activityId: 'x', name: 'New Name' }))
      .toThrow('Activity not found')
  })

  it('DeleteActivity returns ActivityDeleted', () => {
    const event = handler.execute('DeleteActivity', { activityId: 'a-1' })
    expect(event.type).toBe('ActivityDeleted')
  })

  it('AddSlotToActivity throws when activity not found', () => {
    expect(() => handler.execute('AddSlotToActivity', { activityId: 'x', day: 'saturday', startTime: '10:00', endTime: '12:00' }))
      .toThrow('Activity not found')
  })

  it('AddSubCounter creates a new log when none exists', () => {
    const event = handler.execute('AddSubCounter', { label: 'Samedi' })
    expect(event.type).toBe('SubCounterAdded')
    expect((event.payload as { subCounters: { label: string }[] }).subCounters[0].label).toBe('Samedi')
  })

  it('RecordSubCounterEntries throws when no entry log', () => {
    expect(() => handler.execute('RecordSubCounterEntries', { subCounterId: 'x', adults: 1, children: 0, families: 0 }))
      .toThrow('No entry log found')
  })

  it('full activity flow: create, add slot, register', () => {
    const actEvent = handler.execute('CreateActivity', { name: 'Quiz' })
    store.append({ ...actEvent, id: '1', occurredAt: new Date().toISOString() })

    const state1 = projection.rebuild()
    const slotEvent = handler.execute('AddSlotToActivity', {
      activityId: state1.activities[0].id,
      day: 'saturday', startTime: '10:00', endTime: '12:00',
    })
    store.append({ ...slotEvent, id: '2', occurredAt: new Date().toISOString() })

    const state = projection.rebuild()
    const activityId = state.activities[0].id
    const slotId = state.activities[0].slots[0].id

    const regEvent = handler.execute('RegisterToActivity', { activityId, slotId, personName: 'Alice' })
    expect(regEvent.type).toBe('RegistrationAdded')
    expect((regEvent.payload as { slots: { registrations: { personName: string }[] }[] }).slots[0].registrations[0].personName).toBe('Alice')
  })

  it('full entry log flow: add sub-counter, record entries', () => {
    const addEvent = handler.execute('AddSubCounter', { label: 'Samedi' })
    store.append({ ...addEvent, id: '1', occurredAt: new Date().toISOString() })

    const state1 = projection.rebuild()
    const subCounterId = state1.entryLog!.subCounters[0].id
    const recordEvent = handler.execute('RecordSubCounterEntries', { subCounterId, adults: 5, children: 2, families: 0 })
    expect(recordEvent.type).toBe('EntriesRecorded')
    expect((recordEvent.payload as { subCounters: { batches: { adults: number }[] }[] }).subCounters[0].batches[0].adults).toBe(5)
  })

  it('throws on unknown action', () => {
    expect(() => handler.execute('UnknownAction', {})).toThrow('Unknown action')
  })
})
