import { describe, it, expect, beforeEach } from 'vitest'
import { EventStore } from './EventStore'

describe('EventStore', () => {
  let store

  beforeEach(() => {
    store = new EventStore(':memory:')
  })

  it('appends and replays events for a module', async () => {
    await store.append({ id: '1', module: 'mioum', type: 'ProductCreated', aggregateId: 'p1', payload: { name: 'Bière' }, occurredAt: new Date().toISOString() })
    await store.append({ id: '2', module: 'mioum', type: 'ProductCreated', aggregateId: 'p2', payload: { name: 'Eau' }, occurredAt: new Date().toISOString() })

    const events = await store.replayModule('mioum')
    expect(events).toHaveLength(2)
    expect(events[0].type).toBe('ProductCreated')
    expect(events[0].payload.name).toBe('Bière')
  })

  it('returns events ordered by occurredAt', async () => {
    await store.append({ id: '1', module: 'mioum', type: 'ProductCreated', aggregateId: 'p1', payload: {}, occurredAt: '2024-01-01T10:00:00.000Z' })
    await store.append({ id: '2', module: 'mioum', type: 'ProductDeleted', aggregateId: 'p1', payload: {}, occurredAt: '2024-01-01T10:00:01.000Z' })

    const events = await store.replayModule('mioum')
    expect(events[0].type).toBe('ProductCreated')
    expect(events[1].type).toBe('ProductDeleted')
  })

  it('isolates events by module', async () => {
    await store.append({ id: '1', module: 'mioum', type: 'ProductCreated', aggregateId: 'p1', payload: {}, occurredAt: new Date().toISOString() })
    await store.append({ id: '2', module: 'crew', type: 'VolunteerCreated', aggregateId: 'v1', payload: {}, occurredAt: new Date().toISOString() })

    const mioumEvents = await store.replayModule('mioum')
    expect(mioumEvents).toHaveLength(1)
    expect(mioumEvents[0].module).toBe('mioum')
  })
})
