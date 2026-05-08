import { CommandDispatcher } from './CommandDispatcher.js'

const dispatcher = new CommandDispatcher()
const clients = new Set()

Bun.serve({
  port: 3000,
  fetch(req, server) {
    if (server.upgrade(req)) return
    return new Response('ludinator server', { status: 200 })
  },
  websocket: {
    async open(ws) {
      clients.add(ws)
      const snapshots = await dispatcher.snapshots()
      for (const { module, data } of snapshots) {
        ws.send(JSON.stringify({ type: 'state', module, data }))
      }
    },
    async message(ws, raw) {
      const cmd = JSON.parse(raw)
      await dispatcher.handle(ws, cmd, clients)
    },
    close(ws) {
      clients.delete(ws)
    },
  },
})

console.log('ludinator server running on ws://localhost:3000')
