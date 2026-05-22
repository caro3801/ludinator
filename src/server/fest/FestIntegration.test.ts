import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { EventStore } from '../EventStore'
import { CommandDispatcher } from '../CommandDispatcher'

describe('Fest integration', () => {
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

  it('sends initial fest snapshot on connection', async () => {
    const ws3 = new WebSocket(`ws://localhost:${server.port}`)
    const snapshot = await new Promise(resolve => {
      ws3.onmessage = ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'fest') resolve(msg.data)
      }
    })
    expect(snapshot.activities).toEqual([])
    expect(snapshot.entryLog).toBeNull()
    ws3.close()
  })

  it('creates an activity and broadcasts to all clients', async () => {
    const promise1 = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'fest' && msg.data.activities.length > 0) resolve(msg.data)
      })
    })
    const promise2 = new Promise(resolve => {
      ws2.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'fest' && msg.data.activities.length > 0) resolve(msg.data)
      })
    })

    ws1.send(JSON.stringify({ id: 'cmd-1', module: 'fest', action: 'CreateActivity', payload: { name: 'Escape Game', location: 'Salle A' } }))

    const [state1, state2] = await Promise.all([promise1, promise2])
    expect(state1.activities[0].name).toBe('Escape Game')
    expect(state2.activities[0].name).toBe('Escape Game')
  })

  it('full activity flow: create, add slot, register', async () => {
    const slotStatePromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'fest' && msg.data.activities[0]?.slots?.length > 0) resolve(msg.data)
      })
    })
    const activityId = dispatcher.snapshots().find(s => s.module === 'fest').data.activities[0].id
    ws1.send(JSON.stringify({ id: 'cmd-2', module: 'fest', action: 'AddSlotToActivity', payload: { activityId, day: 'saturday', startTime: '10:00', endTime: '12:00' } }))
    await slotStatePromise

    const state1 = dispatcher.snapshots().find(s => s.module === 'fest').data
    const slotId = state1.activities[0].slots[0].id

    const regStatePromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'fest' && msg.data.activities[0]?.slots[0]?.registrations?.length > 0) resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-3', module: 'fest', action: 'RegisterToActivity', payload: { activityId, slotId, personName: 'Alice' } }))
    const finalState = await regStatePromise

    expect(finalState.activities[0].slots[0].registrations[0].personName).toBe('Alice')
  })

  it('entry log flow: add sub-counter and record entries', async () => {
    const subCounterStatePromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'fest' && msg.data.entryLog?.subCounters?.length > 0) resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-4', module: 'fest', action: 'AddSubCounter', payload: { label: 'Samedi' } }))
    await subCounterStatePromise

    const state = dispatcher.snapshots().find(s => s.module === 'fest').data
    const subCounterId = state.entryLog.subCounters[0].id

    const entriesStatePromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'fest' && msg.data.entryLog?.subCounters[0]?.batches?.length > 0) resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-5', module: 'fest', action: 'RecordSubCounterEntries', payload: { subCounterId, adults: 5, children: 2, families: 0 } }))
    const finalState = await entriesStatePromise

    expect(finalState.entryLog.subCounters[0].batches[0].adults).toBe(5)
  })

  it('validation error returns ok:false ack', async () => {
    const ackPromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.id === 'cmd-err') resolve(msg)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-err', module: 'fest', action: 'CreateActivity', payload: { name: '' } }))
    const ack = await ackPromise

    expect(ack.ok).toBe(false)
    expect(ack.error).toBeDefined()
  })
})
