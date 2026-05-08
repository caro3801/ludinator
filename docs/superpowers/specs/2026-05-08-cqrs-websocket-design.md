# CQRS + WebSocket + Event-Ready — Design Spec

**Date:** 2026-05-08  
**Modules concernés:** mioum, crew, fest  
**Objectif:** Déplacer la logique métier du thread principal vers un serveur Bun exposant une API WebSocket, avec une architecture CQRS event-ready permettant une transition future vers l'event sourcing complet.

---

## 1. Contexte

Le projet contient trois modules (mioum, crew, fest) suivant une architecture DDD :
- `domain/model` — entités et value objects
- `application/usecases` — cas d'usage
- `adapters/storage` — adaptateurs LocalStorage
- `adapters/ui` — Web Components

Actuellement les orchestrateurs (`mioum.js`, `crew.js`, `fest.js`) tournent dans le thread principal du navigateur, instancient les use cases, et écoutent des événements DOM. L'état est persisté en LocalStorage.

Ce design migre la logique vers un serveur Bun en gardant une porte ouverte vers l'event sourcing complet.

---

## 2. Architecture générale

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│                                                         │
│  UI thread                  WebWorker (optionnel)       │
│  ┌──────────┐  postMessage  ┌─────────────────────────┐ │
│  │ mioum.js │◄─────────────►│ worker.js               │ │
│  │ crew.js  │               │  WebSocket client       │ │
│  │ fest.js  │               │  reconnect logic        │ │
│  └──────────┘               └──────────┬──────────────┘ │
└─────────────────────────────────────── │ ───────────────┘
                                         │ WebSocket
┌────────────────────────────────────────▼───────────────┐
│  Bun server                                            │
│                                                        │
│  CommandDispatcher                                     │
│    1. exécute le use case (logique domaine pure)       │
│    2. reçoit un DomainEvent en retour                  │
│    3. append dans EventStore (SQLite)                  │
│    4. rejoue la projection du module                   │
│    5. broadcast state à tous les clients               │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  EventStore  │  │ Projections  │  │  Use cases  │  │
│  │  SQLite      │  │  read model  │  │  purs       │  │
│  │  append/     │  │  par module  │  │  → Event    │  │
│  │  replay      │  │              │  │             │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Protocole WebSocket

### 3.1 Commande (client → serveur)

```json
{
  "id": "uuid-v4",
  "module": "mioum",
  "action": "CreateProduct",
  "payload": { "name": "Bière", "price": 3.5 }
}
```

### 3.2 Accusé de réception (serveur → client émetteur)

```json
{ "id": "uuid-v4", "ok": true }
{ "id": "uuid-v4", "ok": false, "error": "ValidationError: le nom est requis" }
```

### 3.3 State broadcast (serveur → tous les clients)

```json
{
  "type": "state",
  "module": "mioum",
  "data": {
    "products": [...],
    "tickets": [...],
    "currentTicket": { ... }
  }
}
```

### 3.4 Snapshot initial

À la connexion d'un client, le serveur envoie immédiatement un message `state` pour chaque module (mioum, crew, fest).

### 3.5 Mapping commandes

| Module | Action | Use case existant |
|--------|--------|-------------------|
| mioum | CreateProduct | CreateProduct |
| mioum | UpdateProduct | UpdateProduct |
| mioum | DeleteProduct | DeleteProduct |
| mioum | OpenTicket | OpenTicket |
| mioum | AddLineToTicket | AddLineToTicket |
| mioum | RemoveLineFromTicket | RemoveLineFromTicket |
| mioum | DecrementLineQuantity | DecrementLineQuantity |
| mioum | CloseTicket | CloseTicket |
| mioum | CancelTicket | CancelTicket |
| mioum | ReopenTicket | ReopenTicket |
| crew | CreateVolunteer | CreateVolunteer |
| crew | UpdateVolunteerName | UpdateVolunteerName |
| crew | DeleteVolunteer | DeleteVolunteer |
| crew | CreatePost | CreatePost |
| crew | UpdatePostName | UpdatePostName |
| crew | DeletePost | DeletePost |
| crew | AddSlotToPost | AddSlotToPost |
| crew | UpdateSlotInPost | UpdateSlotInPost |
| crew | RemoveSlotFromPost | RemoveSlotFromPost |
| crew | AssignVolunteer | AssignVolunteer |
| crew | UnassignVolunteer | UnassignVolunteer |
| fest | CreateActivity | CreateActivity |
| fest | UpdateActivityName | UpdateActivityName |
| fest | DeleteActivity | DeleteActivity |
| fest | AddSlotToActivity | AddSlotToActivity |
| fest | RegisterToActivity | RegisterToActivity |
| fest | CancelRegistration | CancelRegistration |
| fest | AddSubCounter | AddSubCounter |
| fest | RemoveSubCounter | RemoveSubCounter |
| fest | RecordSubCounterEntries | RecordSubCounterEntries |
| fest | UpdateSubCounterBatch | UpdateSubCounterBatch |
| fest | DeleteSubCounterBatch | DeleteSubCounterBatch |

---

## 4. Structure du serveur

```
src/
  server/
    server.js                      ← Bun entry point, WebSocket setup
    EventStore.js                  ← append / replay sur SQLite
    CommandDispatcher.js           ← route module+action → handler
    mioum/
      MioumCommandHandler.js
      MioumProjection.js
      SqliteProductRepository.js
      SqliteTicketRepository.js
    crew/
      CrewCommandHandler.js
      CrewProjection.js
      SqliteVolunteerRepository.js
      SqlitePostRepository.js
      SqliteScheduleRepository.js
    fest/
      FestCommandHandler.js
      FestProjection.js
      SqliteActivityRepository.js
      SqliteEntryLogRepository.js
```

### 4.1 server.js

```js
Bun.serve({
  port: 3000,
  fetch(req, server) {
    if (server.upgrade(req)) return
  },
  websocket: {
    open(ws) {
      // envoie le snapshot initial de tous les modules
      for (const module of ['mioum', 'crew', 'fest']) {
        const state = await projections[module].rebuild()
        ws.send(JSON.stringify({ type: 'state', module, data: state }))
      }
    },
    message(ws, raw) {
      const cmd = JSON.parse(raw)
      dispatcher.handle(ws, cmd)
    }
  }
})
```

### 4.2 CommandDispatcher.js

```js
async handle(ws, { id, module, action, payload }) {
  try {
    const handler = this.handlers[module]
    const domainEvent = handler.execute(action, payload)
    await this.eventStore.append(domainEvent)
    const state = await this.projections[module].rebuild()
    this.broadcast(module, state)
    ws.send(JSON.stringify({ id, ok: true }))
  } catch (err) {
    ws.send(JSON.stringify({ id, ok: false, error: err.message }))
  }
}
```

### 4.3 EventStore.js

Schéma SQLite :

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  type TEXT NOT NULL,
  aggregate_id TEXT,
  payload TEXT NOT NULL,
  occurred_at DATETIME NOT NULL
)
```

Interface :
- `append(domainEvent)` — insère un event
- `replayModule(module)` — retourne tous les events d'un module dans l'ordre

### 4.4 Projections

Chaque projection reçoit la liste des events de son module et retourne l'état courant :

```js
// MioumProjection.js
async rebuild() {
  const events = await this.eventStore.replayModule('mioum')
  return events.reduce(applyEvent, { products: [], tickets: [] })
}
```

---

## 5. Refactoring des use cases

Les use cases deviennent des fonctions pures : ils valident, construisent l'entité, et retournent un domain event sans effet de bord. Plus d'injection de repository.

```js
// Avant
class CreateProduct {
  async execute({ name, price }) {
    const product = new Product({ id: generateId(), name, price })
    await this.productRepo.save(product)
    return product
  }
}

// Après
class CreateProduct {
  execute({ name, price }) {
    const product = new Product({ id: generateId(), name, price })
    return new ProductCreated({ product, occurredAt: new Date() })
  }
}
```

Les tests unitaires existants sont adaptés pour vérifier le type et le payload du domain event retourné.

---

## 6. Structure du client

```
src/
  client/
    WsClient.js     ← connexion, reconnect, send/onState
    worker.js       ← (optionnel) proxy WebSocket dans un WebWorker
  mioum/
    mioum.js        ← remplacé : events DOM → WS commands, state → refresh
  crew/
    crew.js         ← idem
  fest/
    fest.js         ← idem
```

### 6.1 WsClient.js

```js
export class WsClient {
  // envoie une commande, retourne Promise<void> (rejette sur ok: false)
  send(module, action, payload) { ... }

  // abonne au broadcast d'état d'un module
  onState(module, callback) { ... }
}
```

### 6.2 Orchestrateurs après migration

```js
// mioum.js (après)
const ws = new WsClient('ws://localhost:3000')

ws.onState('mioum', ({ products, tickets, currentTicket }) => {
  productList.refresh(products)
  ticketView.refresh(currentTicket, products)
  statsView.refresh(tickets)
  historyView.refresh(tickets)
})

document.addEventListener('product-delete-requested', e =>
  ws.send('mioum', 'DeleteProduct', { id: e.detail.productId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('line-add-requested', e =>
  ws.send('mioum', 'AddLineToTicket', e.detail)
    .catch(err => dispatchError(err.message)))
// ...
```

Les composants UI (Web Components) ne changent pas.

### 6.3 WebWorker (optionnel)

Si activé, `WsClient` délègue la connexion WebSocket à `worker.js` via `postMessage`. L'interface `WsClient` reste identique — l'orchestrateur ignore s'il parle à un worker ou directement au WebSocket.

---

## 7. Gestion des erreurs

### Erreurs de validation
Le use case lève une `ValidationError` avant d'émettre un event. Le `CommandDispatcher` la catch, envoie l'ack `ok: false` à l'émetteur uniquement. Aucun event n'est stocké.

### Déconnexion WebSocket
`WsClient` tente une reconnexion exponentielle (1s, 2s, 4s… jusqu'à 30s). Les commandes en attente pendant la déconnexion sont rejetées immédiatement. À la reconnexion, le snapshot initial remet l'UI à jour.

### Erreurs serveur inattendues
Loguées côté serveur. Ack `ok: false` avec message générique côté client. Aucun event partiel n'est écrit.

---

## 8. Tests

### Use cases (tests unitaires)
Fonctions pures : on vérifie le type et le payload du domain event retourné.

```js
it('emits ProductCreated', () => {
  const event = new CreateProduct().execute({ name: 'Bière', price: 3.5 })
  expect(event).toBeInstanceOf(ProductCreated)
  expect(event.product.name).toBe('Bière')
})
```

### Projections
Séquence d'events en entrée, état résultant en sortie.

```js
it('rebuilds products list', () => {
  const events = [new ProductCreated({ product: biere }), new ProductDeleted({ productId: biere.id })]
  const state = applyEvents(events, { products: [], tickets: [] })
  expect(state.products).toHaveLength(0)
})
```

### CommandDispatcher
EventStore in-memory + mock broadcast. On vérifie que la commande déclenche le bon event et le bon broadcast.

### WsClient
WebSocket mocké. On vérifie send/ack/onState.

### Intégration
Serveur Bun sur port éphémère, client WebSocket réel, commande envoyée, broadcast reçu vérifié.

---

## 9. Ce qui ne change pas

- Les Web Components (`adapters/ui`) — aucune modification
- Les modèles de domaine (`domain/model`) — aucune modification
- Les erreurs domaine (`domain/errors`) — aucune modification
- Les interfaces de ports (`ports/`) — aucune modification
- Les alertes UI existantes

---

## 10. Transition future vers l'event sourcing complet

Cette architecture est déjà event-ready :
- Les events sont stockés dans l'EventStore
- L'état est dérivé par replay des events
- Les use cases sont purs et sans effet de bord

Pour passer à l'event sourcing complet, il suffira de :
1. Enrichir les domain events (métadonnées, versioning)
2. Optimiser le rebuild des projections (snapshots, caches)
3. Ajouter des read models secondaires (ex: audit log, stats)

Aucun changement de protocole WebSocket ni de composants UI requis.
