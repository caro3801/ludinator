import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandDispatcher } from './CommandDispatcher'
import { EventStore } from './EventStore'
import { ServerWebSocket } from 'bun'

describe('CommandDispatcher', () => {
  let store: EventStore
  let dispatcher: CommandDispatcher

  beforeEach(() => {
    store = new EventStore(':memory:')
    dispatcher = new CommandDispatcher(store)
  })

  it('handles a mioum command and returns broadcast state', async () => {
    const sendMock = vi.fn()
    const fakeWs = { send: sendMock } as unknown as ServerWebSocket<unknown>
    const clients = new Set([fakeWs])

    await dispatcher.handle(
      fakeWs,
      { id: 'cmd-1', module: 'mioum', action: 'CreateProduct', payload: { name: 'Bière', price: 3.0, category: 'Boissons' } },
      clients
    )

    expect(sendMock).toHaveBeenCalledTimes(2)
    const ack = JSON.parse(sendMock.mock.calls[0][0] as string)
    expect(ack).toEqual({ id: 'cmd-1', ok: true })

    const broadcast = JSON.parse(sendMock.mock.calls[1][0] as string)
    expect(broadcast.type).toBe('state')
    expect(broadcast.module).toBe('mioum')
    expect(broadcast.data.products).toHaveLength(1)
  })

  it('sends error ack on validation failure', async () => {
    const sendMock = vi.fn()
    const fakeWs = { send: sendMock } as unknown as ServerWebSocket<unknown>
    const clients = new Set([fakeWs])

    await dispatcher.handle(
      fakeWs,
      { id: 'cmd-2', module: 'mioum', action: 'CreateProduct', payload: { name: '', price: 3.0, category: 'Boissons' } },
      clients
    )

    const ack = JSON.parse(sendMock.mock.calls[0][0] as string)
    expect(ack.ok).toBe(false)
    expect(ack.error).toBeDefined()
  })

  it('returns snapshots for all registered modules', () => {
    const snapshots = dispatcher.snapshots()
    const mioumSnapshot = snapshots.find(s => s.module === 'mioum')
    expect(mioumSnapshot).toBeDefined()
    expect((mioumSnapshot as { data: { products: unknown[] } }).data.products).toEqual([])
  })
})
