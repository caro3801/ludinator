import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { EventStore } from '../EventStore'
import { CommandDispatcher } from '../CommandDispatcher'

describe('Mioum integration', () => {
  let store, dispatcher, server, ws1, ws2

  beforeAll(async () => {
    store = new EventStore(':memory:')
    dispatcher = new CommandDispatcher(store)
    const clients = new Set()

    server = Bun.serve({
      port: 0,
      fetch(req, srv) { if (srv.upgrade(req)) return },
      websocket: {
        async open(ws) {
          clients.add(ws)
          const snapshots = dispatcher.snapshots()
          for (const { module, data } of snapshots)
            ws.send(JSON.stringify({ type: 'state', module, data }))
        },
        async message(ws, raw) {
          await dispatcher.handle(ws, JSON.parse(raw), clients)
        },
        close(ws) { clients.delete(ws) },
      },
    })

    const url = `ws://localhost:${server.port}`
    ws1 = new WebSocket(url)
    ws2 = new WebSocket(url)
    await Promise.all([
      new Promise(r => { ws1.onopen = r }),
      new Promise(r => { ws2.onopen = r }),
    ])
  })

  afterAll(() => {
    ws1.close()
    ws2.close()
    server.stop()
  })

  it('sends initial snapshot on connection', async () => {
    const ws3 = new WebSocket(`ws://localhost:${server.port}`)
    const snapshot = await new Promise(resolve => {
      ws3.onmessage = ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'mioum') resolve(msg.data)
      }
    })
    expect(snapshot.products).toEqual([])
    expect(snapshot.tickets).toEqual([])
    ws3.close()
  })

  it('creates a product and broadcasts state to all clients', async () => {
    const statePromise1 = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'mioum' && msg.data.products.length > 0)
          resolve(msg.data)
      })
    })
    const statePromise2 = new Promise(resolve => {
      ws2.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'mioum' && msg.data.products.length > 0)
          resolve(msg.data)
      })
    })

    ws1.send(JSON.stringify({ id: 'cmd-1', module: 'mioum', action: 'CreateProduct', payload: { name: 'Bière', price: 3.0, category: 'Boissons' } }))

    const [state1, state2] = await Promise.all([statePromise1, statePromise2])
    expect(state1.products[0].name).toBe('Bière')
    expect(state2.products[0].name).toBe('Bière')
  })

  it('opens a ticket and adds a line', async () => {
    const productId = dispatcher.snapshots().find(s => s.module === 'mioum').data.products[0].id

    const ticketStatePromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'mioum' && msg.data.currentTicket)
          resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-2', module: 'mioum', action: 'OpenTicket', payload: {} }))
    await ticketStatePromise

    const lineStatePromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'mioum' && msg.data.currentTicket?.lines?.length > 0)
          resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-3', module: 'mioum', action: 'AddLineToTicket', payload: { productId, quantity: 2 } }))
    const finalState = await lineStatePromise

    expect(finalState.currentTicket.lines).toHaveLength(1)
    expect(finalState.currentTicket.total).toBe(6.0)
  })

  it('validation error sends ok:false ack', async () => {
    const ackPromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.id === 'cmd-err') resolve(msg)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-err', module: 'mioum', action: 'CreateProduct', payload: { name: '', price: 3.0, category: 'Boissons' } }))
    const ack = await ackPromise

    expect(ack.ok).toBe(false)
    expect(ack.error).toBeDefined()
  })
})
