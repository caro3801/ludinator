import { describe, it, expect } from 'vitest'
import { FestProjection } from './FestProjection.js'
import { EventStore } from '../EventStore.js'
import { Activity } from '../../fest/domain/model/Activity.js'
import { EntryLog } from '../../fest/domain/model/EntryLog.js'
import { TimeWindow } from '../../fest/domain/model/TimeWindow.js'

describe('FestProjection', () => {
  it('starts with empty state', () => {
    const store = new EventStore(':memory:')
    const state = new FestProjection(store).rebuild()
    expect(state.activities).toEqual([])
    expect(state.entryLog).toBeNull()
  })

  it('adds activity from ActivityCreated', () => {
    const store = new EventStore(':memory:')
    const activity = Activity.create('Escape Game').toJSON()
    store.append({ id: '1', module: 'fest', type: 'ActivityCreated', aggregateId: activity.id, payload: activity, occurredAt: new Date().toISOString() })
    const state = new FestProjection(store).rebuild()
    expect(state.activities).toHaveLength(1)
    expect(state.activities[0].name).toBe('Escape Game')
  })

  it('removes activity from ActivityDeleted', () => {
    const store = new EventStore(':memory:')
    const activity = Activity.create('Quiz').toJSON()
    store.append({ id: '1', module: 'fest', type: 'ActivityCreated', aggregateId: activity.id, payload: activity, occurredAt: '2024-01-01T10:00:00.000Z' })
    store.append({ id: '2', module: 'fest', type: 'ActivityDeleted', aggregateId: activity.id, payload: { activityId: activity.id }, occurredAt: '2024-01-01T10:00:01.000Z' })
    const state = new FestProjection(store).rebuild()
    expect(state.activities).toHaveLength(0)
  })

  it('updates activity name from ActivityNameUpdated', () => {
    const store = new EventStore(':memory:')
    const a = Activity.create('Escape Game')
    store.append({ id: '1', module: 'fest', type: 'ActivityCreated', aggregateId: a.id, payload: a.toJSON(), occurredAt: '2024-01-01T10:00:00.000Z' })
    a.updateName('Super Escape')
    store.append({ id: '2', module: 'fest', type: 'ActivityNameUpdated', aggregateId: a.id, payload: a.toJSON(), occurredAt: '2024-01-01T10:00:01.000Z' })
    const state = new FestProjection(store).rebuild()
    expect(state.activities[0].name).toBe('Super Escape')
  })

  it('tracks entryLog from SubCounterAdded', () => {
    const store = new EventStore(':memory:')
    const log = EntryLog.create('edition-2024')
    log.addSubCounter('Samedi')
    store.append({ id: '1', module: 'fest', type: 'SubCounterAdded', aggregateId: log.id, payload: log.toJSON(), occurredAt: new Date().toISOString() })
    const state = new FestProjection(store).rebuild()
    expect(state.entryLog).not.toBeNull()
    expect(state.entryLog.subCounters).toHaveLength(1)
  })

  it('adds slot from SlotAddedToActivity', () => {
    const store = new EventStore(':memory:')
    const a = Activity.create('Quiz')
    store.append({ id: '1', module: 'fest', type: 'ActivityCreated', aggregateId: a.id, payload: a.toJSON(), occurredAt: '2024-01-01T10:00:00.000Z' })
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    store.append({ id: '2', module: 'fest', type: 'SlotAddedToActivity', aggregateId: a.id, payload: a.toJSON(), occurredAt: '2024-01-01T10:00:01.000Z' })
    const state = new FestProjection(store).rebuild()
    expect(state.activities[0].slots).toHaveLength(1)
  })
})
