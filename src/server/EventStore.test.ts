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

describe('EventStore - replayModuleSinceLastReset', () => {
  let store: EventStore

  beforeEach(() => {
    store = new EventStore(':memory:')
  })

  it('returns all events when no reset exists', async () => {
    await store.append({ id: '1', module: 'crew', type: 'VolunteerCreated', aggregateId: null, payload: {}, occurredAt: '2024-01-01T00:00:00.000Z' })
    await store.append({ id: '2', module: 'crew', type: 'PostCreated', aggregateId: null, payload: {}, occurredAt: '2024-01-02T00:00:00.000Z' })
    
    const events = await (store as any).replayModuleSinceLastReset('crew')
    expect(events).toHaveLength(2)
  })

  it('returns only events after last reset', async () => {
    await store.append({ id: '1', module: 'crew', type: 'VolunteerCreated', aggregateId: null, payload: {}, occurredAt: '2024-01-01T00:00:00.000Z' })
    await store.append({ id: '2', module: 'admin', type: 'ModuleResetInitiated', aggregateId: null, payload: { module: 'crew' }, occurredAt: '2024-01-02T00:00:00.000Z' })
    await store.append({ id: '3', module: 'crew', type: 'PostCreated', aggregateId: null, payload: {}, occurredAt: '2024-01-03T00:00:00.000Z' })
    
    const events = await (store as any).replayModuleSinceLastReset('crew')
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe('3')
  })

  it('returns empty array when reset is last event', async () => {
    await store.append({ id: '1', module: 'crew', type: 'VolunteerCreated', aggregateId: null, payload: {}, occurredAt: '2024-01-01T00:00:00.000Z' })
    await store.append({ id: '2', module: 'admin', type: 'ModuleResetInitiated', aggregateId: null, payload: { module: 'crew' }, occurredAt: '2024-01-02T00:00:00.000Z' })
    
    const events = await (store as any).replayModuleSinceLastReset('crew')
    expect(events).toHaveLength(0)
  })

  it('returns all events when reset is for different module', async () => {
    await store.append({ id: '1', module: 'crew', type: 'VolunteerCreated', aggregateId: null, payload: {}, occurredAt: '2024-01-01T00:00:00.000Z' })
    await store.append({ id: '2', module: 'admin', type: 'ModuleResetInitiated', aggregateId: null, payload: { module: 'fest' }, occurredAt: '2024-01-02T00:00:00.000Z' })
    await store.append({ id: '3', module: 'crew', type: 'PostCreated', aggregateId: null, payload: {}, occurredAt: '2024-01-03T00:00:00.000Z' })
    
    const events = await (store as any).replayModuleSinceLastReset('crew')
    expect(events).toHaveLength(2)
  })
})
