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

const db = new Database('ludinator.db')

// Initialiser EventStore avec la base partagée
const eventStore = new EventStore()
// Note: EventStore crée sa propre instance de Database, donc on ne peut pas la partager directement
// Solution: modifier EventStore pour accepter une Database en paramètre OU créer une nouvelle connexion
// Pour l'instant, créons une nouvelle connexion pour admin
const adminDb = new Database('ludinator.db')

const dispatcher = new CommandDispatcher(eventStore)
const clients: Set<ServerWebSocket<unknown>> = new Set()

// Initialiser le handler admin avec sa propre connexion
const adminRepo = new SqliteAdminRepository(adminDb)
const adminHandler = new AdminCommandHandler(adminRepo, eventStore)

const server = Bun.serve<unknown>({
  port: 3000,
  hostname: '0.0.0.0',
  fetch(req: Request, server: Server<unknown>): Response | undefined {
    if (server.upgrade(req, { data: undefined })) return undefined
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

console.log('ludinator server running on ws://0.0.0.0:3000')

export { server }
