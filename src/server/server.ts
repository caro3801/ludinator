import { CommandDispatcher } from './CommandDispatcher'
import { EventStore } from './EventStore'
import { Database } from 'bun:sqlite'
import { AdminCommandHandler } from './adapters/handlers/AdminCommandHandler'
import { SqliteAdminRepository } from './adapters/storage/SqliteAdminRepository'

// Créer une base de données partagée
const db = new Database('ludinator.db')

// Initialiser EventStore avec la base partagée
const eventStore = new EventStore()
// Note: EventStore crée sa propre instance de Database, donc on ne peut pas la partager directement
// Solution: modifier EventStore pour accepter une Database en paramètre OU créer une nouvelle connexion
// Pour l'instant, créons une nouvelle connexion pour admin
const adminDb = new Database('ludinator.db')

const dispatcher = new CommandDispatcher(eventStore)
const clients: Set<WebSocket> = new Set()

// Initialiser le handler admin avec sa propre connexion
const adminRepo = new SqliteAdminRepository(adminDb)
const adminHandler = new AdminCommandHandler(adminRepo, eventStore)

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
      
      // Gérer les commandes admin séparément
      if (cmd.module === 'admin') {
        const payload = cmd.payload as Record<string, string>
        switch (cmd.action) {
          case 'CheckAdminSetup':
            const checkResp = await adminHandler.handleCheckAdminSetup()
            ws.send(JSON.stringify(checkResp))
            return
          case 'SetupAdmin':
            const setupResp = await adminHandler.handleSetupAdmin(payload.password)
            ws.send(JSON.stringify(setupResp))
            return
          case 'AdminLogin':
            const loginResp = await adminHandler.handleAdminLogin(payload.password)
            ws.send(JSON.stringify(loginResp))
            return
          case 'ResetModule':
            const resetResp = await adminHandler.handleResetModule(
              payload.module,
              payload.password
            )
            ws.send(JSON.stringify(resetResp))
            // Après un reset, recharger les snapshots pour tous les clients
            const snapshots = await dispatcher.snapshots()
            for (const client of clients) {
              for (const { module, data } of snapshots) {
                client.send(JSON.stringify({ type: 'state', module, data }))
              }
            }
            return
        }
      }
      
      // Commandes normales
      await dispatcher.handle(ws, cmd, clients)
    },
    close(ws: WebSocket): void {
      clients.delete(ws)
    },
  },
})

console.log('ludinator server running on ws://0.0.0.0:3000')
