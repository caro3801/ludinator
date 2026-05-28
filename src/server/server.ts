import { CommandDispatcher } from './CommandDispatcher'
import { EventStore } from './EventStore'
import { Database } from 'bun:sqlite'
import { Server, ServerWebSocket } from 'bun'
import { AdminCommandHandler } from './adapters/handlers/AdminCommandHandler'
import { SqliteAdminRepository } from './adapters/storage/SqliteAdminRepository'
import { EventId } from '../shared/types'

interface Command {
  id: EventId
  module: string
  action: string
  payload: unknown
}

interface AdminPayload {
  password: string
  module?: string
}

const port = parseInt(process.env.PORT || '3000')
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/ludinator.db`
  : 'ludinator.db'

const db = new Database(dbPath)

// Initialiser EventStore avec la base partagée
const eventStore = new EventStore(dbPath)
// Note: EventStore crée sa propre instance de Database, donc on ne peut pas la partager directement
// Solution: modifier EventStore pour accepter une Database en paramètre OU créer une nouvelle connexion
// Pour l'instant, créons une nouvelle connexion pour admin
const adminDb = new Database(dbPath)

const dispatcher = new CommandDispatcher(eventStore)
const clients: Set<ServerWebSocket<unknown>> = new Set()

// Initialiser le handler admin avec sa propre connexion
const adminRepo = new SqliteAdminRepository(adminDb)
const adminHandler = new AdminCommandHandler(adminRepo, eventStore)

const server = Bun.serve<unknown>({
  port,
  hostname: '0.0.0.0',
  async fetch(req: Request, server: Server<unknown>): Promise<Response | undefined> {
    // Check if this is a WebSocket upgrade request
    const upgradeHeader = req.headers.get('upgrade')
    const isWebSocketUpgrade = upgradeHeader?.toLowerCase() === 'websocket'
    
    if (isWebSocketUpgrade && server.upgrade(req, { data: undefined })) {
      return undefined
    }
    
    // Serve static files from dist/
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const filePath = `dist${url.pathname === '/' ? '/index.html' : url.pathname}`
      try {
        const file = Bun.file(filePath)
        if (await file.exists()) {
          return new Response(file)
        }
      } catch {
        // File not found, fall through
      }
    }
    return new Response('ludinator server', { status: 200 })
  },
  websocket: {
    async open(ws: ServerWebSocket<unknown>): Promise<void> {
      clients.add(ws)
      const snapshots = await dispatcher.snapshots()
      for (const { module, data } of snapshots) {
        ws.send(JSON.stringify({ type: 'state', module, data }))
      }
    },
    async message(ws: ServerWebSocket<unknown>, raw: string | Buffer<ArrayBufferLike>): Promise<void> {
      const message = typeof raw === 'string' ? raw : new TextDecoder().decode(raw)
      const cmd: Command = JSON.parse(message)

      if (cmd.module === 'admin') {
        const payload = cmd.payload as AdminPayload
        switch (cmd.action) {
          case 'CheckAdminSetup':
            const checkResp = await adminHandler.handleCheckAdminSetup()
            ws.send(JSON.stringify({ id: cmd.id, ok: true, ...checkResp }))
            return
          case 'SetupAdmin':
            const setupResp = await adminHandler.handleSetupAdmin(payload.password)
            ws.send(JSON.stringify({ id: cmd.id, ok: true, ...setupResp }))
            return
          case 'AdminLogin':
            const loginResp = await adminHandler.handleAdminLogin(payload.password)
            ws.send(JSON.stringify({ id: cmd.id, ok: true, ...loginResp }))
            return
          case 'ResetModule':
            const resetResp = await adminHandler.handleResetModule(
              payload.module as string,
              payload.password
            )
            ws.send(JSON.stringify({ id: cmd.id, ok: true, ...resetResp }))
            const snapshots = await dispatcher.snapshots()
            for (const client of clients) {
              for (const { module, data } of snapshots) {
                client.send(JSON.stringify({ type: 'state', module, data }))
              }
            }
            return
          default:
            ws.send(JSON.stringify({ id: cmd.id, ok: false, error: `Unknown admin action: ${cmd.action}` }))
            return
        }
      }

      // Commandes normales
      await dispatcher.handle(ws, cmd, clients)
    },
    close(ws: ServerWebSocket<unknown>, code: number, reason: string): void {
      clients.delete(ws)
    },
  },
})

console.log(`ludinator server running on ws://0.0.0.0:${port}`)

export { server }
