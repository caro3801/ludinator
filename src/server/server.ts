import { CommandDispatcher } from './CommandDispatcher'

const dispatcher = new CommandDispatcher()
const clients: Set<WebSocket> = new Set()

Bun.serve({
  port: 3000,
  hostname: '0.0.0.0',
  fetch(req: Request, server: Bun.Server): Response | null {
    if (server.upgrade(req)) return null
    return new Response('ludinator server', { status: 200 })
  },
  websocket: {
    async open(ws: WebSocket): Promise<void> {
      clients.add(ws)
      const snapshots = await dispatcher.snapshots()
      for (const { module, data } of snapshots) {
        ws.send(JSON.stringify({ type: 'state', module, data }))
      }
    },
    async message(ws: WebSocket, raw: string): Promise<void> {
      const cmd: { id: string; module: string; action: string; payload: unknown } = JSON.parse(raw)
      await dispatcher.handle(ws, cmd, clients)
    },
    close(ws: WebSocket): void {
      clients.delete(ws)
    },
  },
})

console.log('ludinator server running on ws://0.0.0.0:3000')
