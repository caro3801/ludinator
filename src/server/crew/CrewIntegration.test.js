import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { EventStore } from '../EventStore.js'
import { CommandDispatcher } from '../CommandDispatcher.js'

describe('Crew integration', () => {
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

  it('sends initial crew snapshot on connection', async () => {
    const ws3 = new WebSocket(`ws://localhost:${server.port}`)
    const snapshot = await new Promise(resolve => {
      ws3.onmessage = ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'crew') resolve(msg.data)
      }
    })
    expect(snapshot.volunteers).toEqual([])
    expect(snapshot.posts).toEqual([])
    expect(snapshot.schedule).toBeNull()
    ws3.close()
  })

  it('creates a volunteer and broadcasts to all clients', async () => {
    const promise1 = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'crew' && msg.data.volunteers.length > 0) resolve(msg.data)
      })
    })
    const promise2 = new Promise(resolve => {
      ws2.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'crew' && msg.data.volunteers.length > 0) resolve(msg.data)
      })
    })

    ws1.send(JSON.stringify({ id: 'cmd-1', module: 'crew', action: 'CreateVolunteer', payload: { name: 'Alice' } }))

    const [state1, state2] = await Promise.all([promise1, promise2])
    expect(state1.volunteers[0].name).toBe('Alice')
    expect(state2.volunteers[0].name).toBe('Alice')
  })

  it('full flow: create post, add slot, assign volunteer', async () => {
    const postStatePromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'crew' && msg.data.posts.length > 0) resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-2', module: 'crew', action: 'CreatePost', payload: { name: 'Bar', minVolunteers: 1 } }))
    await postStatePromise

    const state1 = dispatcher.snapshots().find(s => s.module === 'crew').data
    const postId = state1.posts[0].id

    const slotStatePromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'crew' && msg.data.posts[0]?.slots?.length > 0) resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-3', module: 'crew', action: 'AddSlotToPost', payload: { postId, day: 'samedi', startTime: '10:00', endTime: '14:00' } }))
    await slotStatePromise

    const state2 = dispatcher.snapshots().find(s => s.module === 'crew').data
    const slotId = state2.posts[0].slots[0].id
    const volunteerId = state2.volunteers[0].id

    const assignStatePromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'crew' && msg.data.schedule?.assignments?.length > 0) resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-4', module: 'crew', action: 'AssignVolunteer', payload: { volunteerId, slotId } }))
    const finalState = await assignStatePromise

    expect(finalState.schedule.assignments).toHaveLength(1)
    expect(finalState.schedule.assignments[0].volunteerId).toBe(volunteerId)
  })

  it('validation error returns ok:false ack', async () => {
    const ackPromise = new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.id === 'cmd-err') resolve(msg)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-err', module: 'crew', action: 'CreateVolunteer', payload: { name: '' } }))
    const ack = await ackPromise

    expect(ack.ok).toBe(false)
    expect(ack.error).toBeDefined()
  })
})
