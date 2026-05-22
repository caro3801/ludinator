import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandDispatcher } from './CommandDispatcher'
import { EventStore } from './EventStore'

describe('CommandDispatcher', () => {
  let store, dispatcher

  beforeEach(() => {
    store = new EventStore(':memory:')
    dispatcher = new CommandDispatcher(store)
  })

  it('handles a mioum command and returns broadcast state', async () => {
    const fakeWs = { send: vi.fn() }
    const clients = new Set([fakeWs])

    await dispatcher.handle(
      fakeWs,
      { id: 'cmd-1', module: 'mioum', action: 'CreateProduct', payload: { name: 'Bière', price: 3.0, category: 'Boissons' } },
      clients
    )

    expect(fakeWs.send).toHaveBeenCalledTimes(2)
    const ack = JSON.parse(fakeWs.send.mock.calls[0][0])
    expect(ack).toEqual({ id: 'cmd-1', ok: true })

    const broadcast = JSON.parse(fakeWs.send.mock.calls[1][0])
    expect(broadcast.type).toBe('state')
    expect(broadcast.module).toBe('mioum')
    expect(broadcast.data.products).toHaveLength(1)
  })

  it('sends error ack on validation failure', async () => {
    const fakeWs = { send: vi.fn() }
    const clients = new Set([fakeWs])

    await dispatcher.handle(
      fakeWs,
      { id: 'cmd-2', module: 'mioum', action: 'CreateProduct', payload: { name: '', price: 3.0, category: 'Boissons' } },
      clients
    )

    const ack = JSON.parse(fakeWs.send.mock.calls[0][0])
    expect(ack.ok).toBe(false)
    expect(ack.error).toBeDefined()
  })

  it('returns snapshots for all registered modules', () => {
    const snapshots = dispatcher.snapshots()
    expect(snapshots.find(s => s.module === 'mioum')).toBeDefined()
    expect(snapshots.find(s => s.module === 'mioum').data.products).toEqual([])
  })
})
