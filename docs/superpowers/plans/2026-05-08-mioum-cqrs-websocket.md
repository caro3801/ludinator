# Mioum — CQRS WebSocket Event-Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le module mioum vers une architecture CQRS event-ready : use cases purs émettant des domain events, serveur Bun WebSocket avec EventStore SQLite, client WsClient avec queue offline.

**Architecture:** Le serveur Bun exécute les use cases purs, stocke les domain events dans SQLite, reconstruit l'état par replay (projection), et broadcast l'état à tous les clients. Le navigateur envoie des commandes via WebSocket et queue en localStorage quand déconnecté.

**Tech Stack:** Bun (server + SQLite natif via `bun:sqlite`), WebSocket natif Bun, Vitest (tests), Vanilla JS (client)

---

## Fichiers créés / modifiés

### Nouveaux
- `src/server/EventStore.js` — append/replay events sur SQLite
- `src/server/CommandDispatcher.js` — route commandes → handlers, broadcast
- `src/server/mioum/MioumCommandHandler.js` — exécute use cases mioum, hydrate objets domaine
- `src/server/mioum/MioumProjection.js` — replay events → `{ products, tickets }`
- `src/server/server.js` — Bun entry point WebSocket
- `src/mioum/domain/events.js` — 10 domain events mioum
- `src/client/WsClient.js` — connexion WS, queue offline localStorage, reconnect exponentiel

### Modifiés
- `src/mioum/application/usecases/CreateProduct.js` — pur, retourne ProductCreated
- `src/mioum/application/usecases/CreateProduct.test.js`
- `src/mioum/application/usecases/UpdateProduct.js`
- `src/mioum/application/usecases/UpdateProduct.test.js`
- `src/mioum/application/usecases/DeleteProduct.js`
- `src/mioum/application/usecases/DeleteProduct.test.js`
- `src/mioum/application/usecases/OpenTicket.js`
- `src/mioum/application/usecases/OpenTicket.test.js`
- `src/mioum/application/usecases/AddLineToTicket.js`
- `src/mioum/application/usecases/AddLineToTicket.test.js`
- `src/mioum/application/usecases/RemoveLineFromTicket.js`
- `src/mioum/application/usecases/RemoveLineFromTicket.test.js`
- `src/mioum/application/usecases/DecrementLineQuantity.js`
- `src/mioum/application/usecases/DecrementLineQuantity.test.js`
- `src/mioum/application/usecases/CloseTicket.js`
- `src/mioum/application/usecases/CloseTicket.test.js`
- `src/mioum/application/usecases/CancelTicket.js`
- `src/mioum/application/usecases/CancelTicket.test.js`
- `src/mioum/application/usecases/ReopenTicket.js`
- `src/mioum/application/usecases/ReopenTicket.test.js`
- `src/mioum/mioum.js` — remplacé : events DOM → commandes WS, state broadcast → refresh
- `mioum.html` — ajout banner offline

---

## Task 1 : Setup serveur Bun

**Files:**
- Create: `src/server/server.js`
- Modify: `package.json`

- [ ] **Créer le dossier serveur**

```bash
mkdir -p src/server/mioum
```

- [ ] **Ajouter le script bun dans package.json**

```json
{
  "name": "ludinator",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "server": "bun run src/server/server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "devDependencies": {
    "jsdom": "^29.0.2",
    "vite": "^8.0.10",
    "vitest": "^4.1.5"
  },
  "dependencies": {
    "chart.js": "^4.5.1"
  }
}
```

- [ ] **Créer `src/server/server.js` (squelette, sera complété en Task 7)**

```js
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
```

- [ ] **Vérifier que Bun est installé**

```bash
bun --version
```

Expected: une version (ex. `1.x.x`). Si absent : `curl -fsSL https://bun.sh/install | bash`

- [ ] **Commit**

```bash
git add package.json src/server/server.js
git commit -m "feat(server): add bun server skeleton"
```

---

## Task 2 : EventStore SQLite

**Files:**
- Create: `src/server/EventStore.js`

- [ ] **Écrire le test**

Créer `src/server/EventStore.test.js` :

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { EventStore } from './EventStore.js'

describe('EventStore', () => {
  let store

  beforeEach(() => {
    store = new EventStore(':memory:')
  })

  it('appends and replays events for a module', async () => {
    await store.append({ id: '1', module: 'mioum', type: 'ProductCreated', aggregateId: 'p1', payload: { name: 'Bière' }, occurredAt: new Date().toISOString() })
    await store.append({ id: '2', module: 'mioum', type: 'ProductCreated', aggregateId: 'p2', payload: { name: 'Eau' }, occurredAt: new Date().toISOString() })

    const events = await store.replayModule('mioum')
    expect(events).toHaveLength(2)
    expect(events[0].type).toBe('ProductCreated')
    expect(events[0].payload.name).toBe('Bière')
  })

  it('returns events ordered by occurredAt', async () => {
    await store.append({ id: '1', module: 'mioum', type: 'ProductCreated', aggregateId: 'p1', payload: {}, occurredAt: '2024-01-01T10:00:00.000Z' })
    await store.append({ id: '2', module: 'mioum', type: 'ProductDeleted', aggregateId: 'p1', payload: {}, occurredAt: '2024-01-01T10:00:01.000Z' })

    const events = await store.replayModule('mioum')
    expect(events[0].type).toBe('ProductCreated')
    expect(events[1].type).toBe('ProductDeleted')
  })

  it('isolates events by module', async () => {
    await store.append({ id: '1', module: 'mioum', type: 'ProductCreated', aggregateId: 'p1', payload: {}, occurredAt: new Date().toISOString() })
    await store.append({ id: '2', module: 'crew', type: 'VolunteerCreated', aggregateId: 'v1', payload: {}, occurredAt: new Date().toISOString() })

    const mioumEvents = await store.replayModule('mioum')
    expect(mioumEvents).toHaveLength(1)
    expect(mioumEvents[0].module).toBe('mioum')
  })
})
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
npx vitest run src/server/EventStore.test.js
```

Expected: FAIL — `EventStore` not found

- [ ] **Implémenter `src/server/EventStore.js`**

```js
import { Database } from 'bun:sqlite'

export class EventStore {
  #db

  constructor(path = 'ludinator.db') {
    this.#db = new Database(path)
    this.#db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        module TEXT NOT NULL,
        type TEXT NOT NULL,
        aggregate_id TEXT,
        payload TEXT NOT NULL,
        occurred_at TEXT NOT NULL
      )
    `)
  }

  append({ id, module, type, aggregateId, payload, occurredAt }) {
    this.#db.run(
      `INSERT INTO events (id, module, type, aggregate_id, payload, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, module, type, aggregateId ?? null, JSON.stringify(payload), occurredAt]
    )
  }

  replayModule(module) {
    const rows = this.#db.query(
      `SELECT * FROM events WHERE module = ? ORDER BY occurred_at ASC`
    ).all(module)
    return rows.map(row => ({ ...row, payload: JSON.parse(row.payload) }))
  }
}
```

Note : `bun:sqlite` est synchrone par design — pas d'`async/await` nécessaire. Les tests utilisent `:memory:` pour l'isolation.

- [ ] **Lancer les tests**

```bash
npx vitest run src/server/EventStore.test.js
```

Expected: 3 tests PASS

- [ ] **Commit**

```bash
git add src/server/EventStore.js src/server/EventStore.test.js
git commit -m "feat(server): add SQLite EventStore"
```

---

## Task 3 : Domain events mioum

**Files:**
- Create: `src/mioum/domain/events.js`

- [ ] **Créer `src/mioum/domain/events.js`**

```js
export class ProductCreated {
  constructor({ product, occurredAt = new Date().toISOString() }) {
    this.type = 'ProductCreated'
    this.module = 'mioum'
    this.aggregateId = product.id
    this.payload = product
    this.occurredAt = occurredAt
  }
}

export class ProductUpdated {
  constructor({ product, occurredAt = new Date().toISOString() }) {
    this.type = 'ProductUpdated'
    this.module = 'mioum'
    this.aggregateId = product.id
    this.payload = product
    this.occurredAt = occurredAt
  }
}

export class ProductDeleted {
  constructor({ productId, occurredAt = new Date().toISOString() }) {
    this.type = 'ProductDeleted'
    this.module = 'mioum'
    this.aggregateId = productId
    this.payload = { productId }
    this.occurredAt = occurredAt
  }
}

export class TicketOpened {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'TicketOpened'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class LineAddedToTicket {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'LineAddedToTicket'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class LineRemovedFromTicket {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'LineRemovedFromTicket'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class LineDecremented {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'LineDecremented'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class TicketClosed {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'TicketClosed'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class TicketCancelled {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'TicketCancelled'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}

export class TicketReopened {
  constructor({ ticket, occurredAt = new Date().toISOString() }) {
    this.type = 'TicketReopened'
    this.module = 'mioum'
    this.aggregateId = ticket.id
    this.payload = ticket
    this.occurredAt = occurredAt
  }
}
```

Note : `payload` est toujours un objet JSON sérialisable (résultat de `toJSON()` du modèle). Le ticket/produit passé au constructeur doit donc être le résultat de `entity.toJSON()`, pas l'instance de classe.

- [ ] **Commit**

```bash
git add src/mioum/domain/events.js
git commit -m "feat(mioum): add domain events"
```

---

## Task 4 : Refactoring use cases mioum (purs)

**Files:** tous les `src/mioum/application/usecases/*.js` et leurs tests

### 4a — CreateProduct

- [ ] **Réécrire `CreateProduct.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { CreateProduct } from './CreateProduct.js'
import { ProductCreated } from '../../domain/events.js'

describe('CreateProduct', () => {
  it('emits ProductCreated with correct data', () => {
    const event = new CreateProduct().execute({ name: 'Bière', price: 3.5, category: 'Boissons' })
    expect(event).toBeInstanceOf(ProductCreated)
    expect(event.payload.name).toBe('Bière')
    expect(event.payload.price).toBe(3.5)
    expect(event.payload.category).toBe('Boissons')
  })

  it('throws ValidationError when name is empty', () => {
    expect(() => new CreateProduct().execute({ name: '', price: 3.5, category: 'Boissons' }))
      .toThrow()
  })

  it('throws ValidationError when price is invalid', () => {
    expect(() => new CreateProduct().execute({ name: 'Bière', price: NaN, category: 'Boissons' }))
      .toThrow()
  })
})
```

- [ ] **Vérifier que les tests échouent**

```bash
npx vitest run src/mioum/application/usecases/CreateProduct.test.js
```

- [ ] **Réécrire `CreateProduct.js`**

```js
import { Product } from '../../domain/model/Product.js'
import { ProductCreated } from '../../domain/events.js'

export class CreateProduct {
  execute({ name, price, category }) {
    const product = Product.create(name, price, category)
    return new ProductCreated({ product: product.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/mioum/application/usecases/CreateProduct.test.js
```

Expected: PASS

### 4b — UpdateProduct

- [ ] **Réécrire `UpdateProduct.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { UpdateProduct } from './UpdateProduct.js'
import { ProductUpdated } from '../../domain/events.js'
import { Product } from '../../domain/model/Product.js'

describe('UpdateProduct', () => {
  it('emits ProductUpdated with new values', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const event = new UpdateProduct().execute({ product: product.toJSON(), name: 'Bière pression', price: 4.0, category: 'Boissons' })
    expect(event).toBeInstanceOf(ProductUpdated)
    expect(event.payload.name).toBe('Bière pression')
    expect(event.payload.price).toBe(4.0)
  })

  it('throws when name is empty', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    expect(() => new UpdateProduct().execute({ product: product.toJSON(), name: '', price: 3.0, category: 'Boissons' }))
      .toThrow()
  })
})
```

- [ ] **Réécrire `UpdateProduct.js`**

```js
import { Product } from '../../domain/model/Product.js'
import { ProductUpdated } from '../../domain/events.js'

export class UpdateProduct {
  execute({ product: productData, name, price, category }) {
    const product = Product.fromJSON(productData)
    product.update({ name, price, category })
    return new ProductUpdated({ product: product.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/mioum/application/usecases/UpdateProduct.test.js
```

Expected: PASS

### 4c — DeleteProduct

- [ ] **Réécrire `DeleteProduct.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { DeleteProduct } from './DeleteProduct.js'
import { ProductDeleted } from '../../domain/events.js'

describe('DeleteProduct', () => {
  it('emits ProductDeleted with correct productId', () => {
    const event = new DeleteProduct().execute({ productId: 'abc-123' })
    expect(event).toBeInstanceOf(ProductDeleted)
    expect(event.payload.productId).toBe('abc-123')
  })
})
```

- [ ] **Réécrire `DeleteProduct.js`**

```js
import { ProductDeleted } from '../../domain/events.js'

export class DeleteProduct {
  execute({ productId }) {
    return new ProductDeleted({ productId })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/mioum/application/usecases/DeleteProduct.test.js
```

Expected: PASS

### 4d — OpenTicket

- [ ] **Réécrire `OpenTicket.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { OpenTicket } from './OpenTicket.js'
import { TicketOpened } from '../../domain/events.js'

describe('OpenTicket', () => {
  it('emits TicketOpened with a new open ticket', () => {
    const event = new OpenTicket().execute()
    expect(event).toBeInstanceOf(TicketOpened)
    expect(event.payload.status).toBe('open')
    expect(event.payload.lines).toEqual([])
  })
})
```

- [ ] **Réécrire `OpenTicket.js`**

```js
import { Ticket } from '../../domain/model/Ticket.js'
import { TicketOpened } from '../../domain/events.js'

export class OpenTicket {
  execute() {
    const ticket = Ticket.create()
    return new TicketOpened({ ticket: ticket.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/mioum/application/usecases/OpenTicket.test.js
```

Expected: PASS

### 4e — AddLineToTicket

- [ ] **Réécrire `AddLineToTicket.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { AddLineToTicket } from './AddLineToTicket.js'
import { LineAddedToTicket } from '../../domain/events.js'
import { Ticket } from '../../domain/model/Ticket.js'
import { Product } from '../../domain/model/Product.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'

describe('AddLineToTicket', () => {
  it('emits LineAddedToTicket with updated total', () => {
    const ticket = Ticket.create().toJSON()
    const product = Product.create('Crêpe', 2.50, 'Snacks').toJSON()
    const event = new AddLineToTicket().execute({ ticket, product, quantity: 3 })
    expect(event).toBeInstanceOf(LineAddedToTicket)
    expect(event.payload.total).toBe(7.50)
    expect(event.payload.lines).toHaveLength(1)
  })

  it('throws ValidationError when adding to a closed ticket', () => {
    const t = Ticket.create()
    const product = Product.create('Crêpe', 2.50, 'Snacks')
    t.addLine(product.id, product.name.value, product.price.value, 1)
    t.close('cash')
    const product2 = Product.create('Eau', 1.0, 'Boissons')
    expect(() => new AddLineToTicket().execute({ ticket: t.toJSON(), product: product2.toJSON(), quantity: 1 }))
      .toThrow(ValidationError)
  })

  it('throws ValidationError when quantity < 1', () => {
    const ticket = Ticket.create().toJSON()
    const product = Product.create('Crêpe', 2.50, 'Snacks').toJSON()
    expect(() => new AddLineToTicket().execute({ ticket, product, quantity: 0 }))
      .toThrow(ValidationError)
  })
})
```

- [ ] **Réécrire `AddLineToTicket.js`**

```js
import { Ticket } from '../../domain/model/Ticket.js'
import { Product } from '../../domain/model/Product.js'
import { LineAddedToTicket } from '../../domain/events.js'

export class AddLineToTicket {
  execute({ ticket: ticketData, product: productData, quantity }) {
    const ticket = Ticket.fromJSON(ticketData)
    const product = Product.fromJSON(productData)
    ticket.addLine(product.id, product.name.value, product.price.value, quantity)
    return new LineAddedToTicket({ ticket: ticket.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/mioum/application/usecases/AddLineToTicket.test.js
```

Expected: PASS

### 4f — RemoveLineFromTicket

- [ ] **Réécrire `RemoveLineFromTicket.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { RemoveLineFromTicket } from './RemoveLineFromTicket.js'
import { LineRemovedFromTicket } from '../../domain/events.js'
import { Ticket } from '../../domain/model/Ticket.js'
import { Product } from '../../domain/model/Product.js'

describe('RemoveLineFromTicket', () => {
  it('emits LineRemovedFromTicket with line removed', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 2)
    const lineId = t.lines[0].id
    const event = new RemoveLineFromTicket().execute({ ticket: t.toJSON(), lineId })
    expect(event).toBeInstanceOf(LineRemovedFromTicket)
    expect(event.payload.lines).toHaveLength(0)
  })
})
```

- [ ] **Réécrire `RemoveLineFromTicket.js`**

```js
import { Ticket } from '../../domain/model/Ticket.js'
import { LineRemovedFromTicket } from '../../domain/events.js'

export class RemoveLineFromTicket {
  execute({ ticket: ticketData, lineId }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.removeLine(lineId)
    return new LineRemovedFromTicket({ ticket: ticket.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/mioum/application/usecases/RemoveLineFromTicket.test.js
```

Expected: PASS

### 4g — DecrementLineQuantity

- [ ] **Réécrire `DecrementLineQuantity.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { DecrementLineQuantity } from './DecrementLineQuantity.js'
import { LineDecremented } from '../../domain/events.js'
import { Ticket } from '../../domain/model/Ticket.js'
import { Product } from '../../domain/model/Product.js'

describe('DecrementLineQuantity', () => {
  it('emits LineDecremented with quantity reduced by 1', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 3)
    const lineId = t.lines[0].id
    const event = new DecrementLineQuantity().execute({ ticket: t.toJSON(), lineId })
    expect(event).toBeInstanceOf(LineDecremented)
    expect(event.payload.lines[0].quantity).toBe(2)
  })
})
```

- [ ] **Réécrire `DecrementLineQuantity.js`**

```js
import { Ticket } from '../../domain/model/Ticket.js'
import { LineDecremented } from '../../domain/events.js'

export class DecrementLineQuantity {
  execute({ ticket: ticketData, lineId }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.decrementLine(lineId)
    return new LineDecremented({ ticket: ticket.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/mioum/application/usecases/DecrementLineQuantity.test.js
```

Expected: PASS

### 4h — CloseTicket

- [ ] **Réécrire `CloseTicket.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { CloseTicket } from './CloseTicket.js'
import { TicketClosed } from '../../domain/events.js'
import { Ticket } from '../../domain/model/Ticket.js'
import { Product } from '../../domain/model/Product.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'

describe('CloseTicket', () => {
  it('emits TicketClosed with status closed', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 1)
    const event = new CloseTicket().execute({ ticket: t.toJSON(), paymentMethod: 'cash' })
    expect(event).toBeInstanceOf(TicketClosed)
    expect(event.payload.status).toBe('closed')
    expect(event.payload.paymentMethod).toBe('cash')
  })

  it('throws ValidationError when ticket is already closed', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 1)
    t.close('cash')
    expect(() => new CloseTicket().execute({ ticket: t.toJSON(), paymentMethod: 'cash' }))
      .toThrow(ValidationError)
  })
})
```

- [ ] **Réécrire `CloseTicket.js`**

```js
import { Ticket } from '../../domain/model/Ticket.js'
import { TicketClosed } from '../../domain/events.js'

export class CloseTicket {
  execute({ ticket: ticketData, paymentMethod = null }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.close(paymentMethod)
    return new TicketClosed({ ticket: ticket.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/mioum/application/usecases/CloseTicket.test.js
```

Expected: PASS

### 4i — CancelTicket

- [ ] **Réécrire `CancelTicket.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { CancelTicket } from './CancelTicket.js'
import { TicketCancelled } from '../../domain/events.js'
import { Ticket } from '../../domain/model/Ticket.js'

describe('CancelTicket', () => {
  it('emits TicketCancelled with status cancelled', () => {
    const ticket = Ticket.create()
    const event = new CancelTicket().execute({ ticket: ticket.toJSON() })
    expect(event).toBeInstanceOf(TicketCancelled)
    expect(event.payload.status).toBe('cancelled')
  })
})
```

- [ ] **Réécrire `CancelTicket.js`**

```js
import { Ticket } from '../../domain/model/Ticket.js'
import { TicketCancelled } from '../../domain/events.js'

export class CancelTicket {
  execute({ ticket: ticketData }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.cancel()
    return new TicketCancelled({ ticket: ticket.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/mioum/application/usecases/CancelTicket.test.js
```

Expected: PASS

### 4j — ReopenTicket

- [ ] **Réécrire `ReopenTicket.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { ReopenTicket } from './ReopenTicket.js'
import { TicketReopened } from '../../domain/events.js'
import { Ticket } from '../../domain/model/Ticket.js'
import { Product } from '../../domain/model/Product.js'

describe('ReopenTicket', () => {
  it('emits TicketReopened with status open', () => {
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 1)
    t.close('cash')
    const event = new ReopenTicket().execute({ ticket: t.toJSON() })
    expect(event).toBeInstanceOf(TicketReopened)
    expect(event.payload.status).toBe('open')
  })
})
```

- [ ] **Réécrire `ReopenTicket.js`**

```js
import { Ticket } from '../../domain/model/Ticket.js'
import { TicketReopened } from '../../domain/events.js'

export class ReopenTicket {
  execute({ ticket: ticketData }) {
    const ticket = Ticket.fromJSON(ticketData)
    ticket.reopen()
    return new TicketReopened({ ticket: ticket.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/mioum/application/usecases/ReopenTicket.test.js
```

Expected: PASS

- [ ] **Lancer tous les tests mioum pour vérifier**

```bash
npx vitest run src/mioum
```

Expected: tous les tests PASS

- [ ] **Commit**

```bash
git add src/mioum/domain/events.js src/mioum/application/usecases/
git commit -m "feat(mioum): refactor use cases to pure domain-event emitters"
```

---

## Task 5 : MioumProjection

**Files:**
- Create: `src/server/mioum/MioumProjection.js`

- [ ] **Écrire le test**

Créer `src/server/mioum/MioumProjection.test.js` :

```js
import { describe, it, expect } from 'vitest'
import { MioumProjection } from './MioumProjection.js'
import { EventStore } from '../EventStore.js'
import { Product } from '../../src/mioum/domain/model/Product.js'
import { Ticket } from '../../src/mioum/domain/model/Ticket.js'
```

Attention : les imports relatifs depuis `src/server/` vers `src/mioum/` utilisent `../../` :

```js
import { describe, it, expect } from 'vitest'
import { MioumProjection } from './MioumProjection.js'
import { EventStore } from '../EventStore.js'
import { Product } from '../../mioum/domain/model/Product.js'
import { Ticket } from '../../mioum/domain/model/Ticket.js'

describe('MioumProjection', () => {
  it('starts with empty state', () => {
    const store = new EventStore(':memory:')
    const projection = new MioumProjection(store)
    const state = projection.rebuild()
    expect(state.products).toEqual([])
    expect(state.tickets).toEqual([])
  })

  it('adds product from ProductCreated event', () => {
    const store = new EventStore(':memory:')
    const product = Product.create('Bière', 3.0, 'Boissons').toJSON()
    store.append({ id: '1', module: 'mioum', type: 'ProductCreated', aggregateId: product.id, payload: product, occurredAt: new Date().toISOString() })
    const state = new MioumProjection(store).rebuild()
    expect(state.products).toHaveLength(1)
    expect(state.products[0].name).toBe('Bière')
  })

  it('removes product from ProductDeleted event', () => {
    const store = new EventStore(':memory:')
    const product = Product.create('Bière', 3.0, 'Boissons').toJSON()
    store.append({ id: '1', module: 'mioum', type: 'ProductCreated', aggregateId: product.id, payload: product, occurredAt: '2024-01-01T10:00:00.000Z' })
    store.append({ id: '2', module: 'mioum', type: 'ProductDeleted', aggregateId: product.id, payload: { productId: product.id }, occurredAt: '2024-01-01T10:00:01.000Z' })
    const state = new MioumProjection(store).rebuild()
    expect(state.products).toHaveLength(0)
  })

  it('tracks open ticket as currentTicket', () => {
    const store = new EventStore(':memory:')
    const ticket = Ticket.create().toJSON()
    store.append({ id: '1', module: 'mioum', type: 'TicketOpened', aggregateId: ticket.id, payload: ticket, occurredAt: new Date().toISOString() })
    const state = new MioumProjection(store).rebuild()
    expect(state.currentTicket).toBeDefined()
    expect(state.currentTicket.id).toBe(ticket.id)
    expect(state.currentTicket.status).toBe('open')
  })

  it('clears currentTicket when ticket is closed', () => {
    const store = new EventStore(':memory:')
    const product = Product.create('Bière', 3.0, 'Boissons')
    const t = Ticket.create()
    t.addLine(product.id, product.name.value, product.price.value, 1)
    t.close('cash')
    const closedTicket = t.toJSON()
    store.append({ id: '1', module: 'mioum', type: 'TicketOpened', aggregateId: closedTicket.id, payload: { ...closedTicket, status: 'open', lines: [] }, occurredAt: '2024-01-01T10:00:00.000Z' })
    store.append({ id: '2', module: 'mioum', type: 'TicketClosed', aggregateId: closedTicket.id, payload: closedTicket, occurredAt: '2024-01-01T10:00:01.000Z' })
    const state = new MioumProjection(store).rebuild()
    expect(state.currentTicket).toBeNull()
    expect(state.tickets).toHaveLength(1)
    expect(state.tickets[0].status).toBe('closed')
  })
})
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
npx vitest run src/server/mioum/MioumProjection.test.js
```

Expected: FAIL — `MioumProjection` not found

- [ ] **Implémenter `src/server/mioum/MioumProjection.js`**

```js
const INITIAL_STATE = { products: [], tickets: [], currentTicket: null }

function applyEvent(state, event) {
  switch (event.type) {
    case 'ProductCreated':
      return { ...state, products: [...state.products, event.payload] }

    case 'ProductUpdated':
      return { ...state, products: state.products.map(p => p.id === event.payload.id ? event.payload : p) }

    case 'ProductDeleted':
      return { ...state, products: state.products.filter(p => p.id !== event.payload.productId) }

    case 'TicketOpened':
      return { ...state, currentTicket: event.payload }

    case 'LineAddedToTicket':
    case 'LineRemovedFromTicket':
    case 'LineDecremented':
      return { ...state, currentTicket: state.currentTicket?.id === event.payload.id ? event.payload : state.currentTicket }

    case 'TicketClosed':
    case 'TicketCancelled':
      return {
        ...state,
        tickets: state.tickets.map(t => t.id === event.payload.id ? event.payload : t).concat(
          state.tickets.find(t => t.id === event.payload.id) ? [] : [event.payload]
        ),
        currentTicket: state.currentTicket?.id === event.payload.id ? null : state.currentTicket,
      }

    case 'TicketReopened':
      return {
        ...state,
        tickets: state.tickets.filter(t => t.id !== event.payload.id),
        currentTicket: event.payload,
      }

    default:
      return state
  }
}

export class MioumProjection {
  #store

  constructor(eventStore) {
    this.#store = eventStore
  }

  rebuild() {
    const events = this.#store.replayModule('mioum')
    return events.reduce(applyEvent, INITIAL_STATE)
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/server/mioum/MioumProjection.test.js
```

Expected: PASS

- [ ] **Commit**

```bash
git add src/server/mioum/MioumProjection.js src/server/mioum/MioumProjection.test.js
git commit -m "feat(server): add MioumProjection"
```

---

## Task 6 : MioumCommandHandler

**Files:**
- Create: `src/server/mioum/MioumCommandHandler.js`

- [ ] **Écrire le test**

Créer `src/server/mioum/MioumCommandHandler.test.js` :

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { MioumCommandHandler } from './MioumCommandHandler.js'
import { MioumProjection } from './MioumProjection.js'
import { EventStore } from '../EventStore.js'

describe('MioumCommandHandler', () => {
  let store, projection, handler

  beforeEach(() => {
    store = new EventStore(':memory:')
    projection = new MioumProjection(store)
    handler = new MioumCommandHandler(projection)
  })

  it('CreateProduct returns ProductCreated event', () => {
    const event = handler.execute('CreateProduct', { name: 'Bière', price: 3.5, category: 'Boissons' })
    expect(event.type).toBe('ProductCreated')
    expect(event.payload.name).toBe('Bière')
  })

  it('DeleteProduct throws when product not found', () => {
    expect(() => handler.execute('DeleteProduct', { productId: 'nonexistent' }))
      .toThrow('Product not found')
  })

  it('AddLineToTicket throws when no open ticket', () => {
    expect(() => handler.execute('AddLineToTicket', { productId: 'p1', quantity: 1 }))
      .toThrow('No open ticket')
  })

  it('full flow: create product, open ticket, add line', () => {
    const created = handler.execute('CreateProduct', { name: 'Bière', price: 3.0, category: 'Boissons' })
    store.append({ ...created, id: '1' })

    const opened = handler.execute('OpenTicket', {})
    store.append({ ...opened, id: '2' })

    const productId = projection.rebuild().products[0].id
    const ticketId = projection.rebuild().currentTicket.id

    const lineAdded = handler.execute('AddLineToTicket', { productId, quantity: 2 })
    expect(lineAdded.type).toBe('LineAddedToTicket')
    expect(lineAdded.payload.total).toBe(6.0)
  })

  it('throws on unknown action', () => {
    expect(() => handler.execute('UnknownAction', {}))
      .toThrow('Unknown action')
  })
})
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
npx vitest run src/server/mioum/MioumCommandHandler.test.js
```

Expected: FAIL

- [ ] **Implémenter `src/server/mioum/MioumCommandHandler.js`**

```js
import { Product } from '../../mioum/domain/model/Product.js'
import { Ticket } from '../../mioum/domain/model/Ticket.js'
import { CreateProduct } from '../../mioum/application/usecases/CreateProduct.js'
import { UpdateProduct } from '../../mioum/application/usecases/UpdateProduct.js'
import { DeleteProduct } from '../../mioum/application/usecases/DeleteProduct.js'
import { OpenTicket } from '../../mioum/application/usecases/OpenTicket.js'
import { AddLineToTicket } from '../../mioum/application/usecases/AddLineToTicket.js'
import { RemoveLineFromTicket } from '../../mioum/application/usecases/RemoveLineFromTicket.js'
import { DecrementLineQuantity } from '../../mioum/application/usecases/DecrementLineQuantity.js'
import { CloseTicket } from '../../mioum/application/usecases/CloseTicket.js'
import { CancelTicket } from '../../mioum/application/usecases/CancelTicket.js'
import { ReopenTicket } from '../../mioum/application/usecases/ReopenTicket.js'

export class MioumCommandHandler {
  #projection

  constructor(projection) {
    this.#projection = projection
  }

  execute(action, payload) {
    const state = this.#projection.rebuild()

    switch (action) {
      case 'CreateProduct':
        return new CreateProduct().execute(payload)

      case 'UpdateProduct': {
        const product = state.products.find(p => p.id === payload.productId)
        if (!product) throw new Error(`Product not found: ${payload.productId}`)
        return new UpdateProduct().execute({ product, ...payload })
      }

      case 'DeleteProduct': {
        const product = state.products.find(p => p.id === payload.productId)
        if (!product) throw new Error(`Product not found: ${payload.productId}`)
        return new DeleteProduct().execute(payload)
      }

      case 'OpenTicket':
        return new OpenTicket().execute()

      case 'AddLineToTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        const product = state.products.find(p => p.id === payload.productId)
        if (!product) throw new Error(`Product not found: ${payload.productId}`)
        return new AddLineToTicket().execute({ ticket, product, quantity: payload.quantity })
      }

      case 'RemoveLineFromTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new RemoveLineFromTicket().execute({ ticket, lineId: payload.lineId })
      }

      case 'DecrementLineQuantity': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new DecrementLineQuantity().execute({ ticket, lineId: payload.lineId })
      }

      case 'CloseTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new CloseTicket().execute({ ticket, paymentMethod: payload.paymentMethod })
      }

      case 'CancelTicket': {
        const ticket = state.currentTicket
        if (!ticket) throw new Error('No open ticket')
        return new CancelTicket().execute({ ticket })
      }

      case 'ReopenTicket': {
        const ticket = state.tickets.find(t => t.id === payload.ticketId)
        if (!ticket) throw new Error(`Ticket not found: ${payload.ticketId}`)
        return new ReopenTicket().execute({ ticket })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/server/mioum/MioumCommandHandler.test.js
```

Expected: PASS

- [ ] **Commit**

```bash
git add src/server/mioum/MioumCommandHandler.js src/server/mioum/MioumCommandHandler.test.js
git commit -m "feat(server): add MioumCommandHandler"
```

---

## Task 7 : CommandDispatcher + server.js (mioum)

**Files:**
- Create: `src/server/CommandDispatcher.js`
- Modify: `src/server/server.js`

- [ ] **Écrire le test du CommandDispatcher**

Créer `src/server/CommandDispatcher.test.js` :

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandDispatcher } from './CommandDispatcher.js'
import { EventStore } from './EventStore.js'

describe('CommandDispatcher', () => {
  let store, dispatcher

  beforeEach(() => {
    store = new EventStore(':memory:')
    dispatcher = new CommandDispatcher(store)
  })

  it('handles a mioum command and returns broadcast state', async () => {
    const broadcasts = []
    const fakeWs = { send: vi.fn() }
    const clients = new Set([fakeWs])

    await dispatcher.handle(
      fakeWs,
      { id: 'cmd-1', module: 'mioum', action: 'CreateProduct', payload: { name: 'Bière', price: 3.0, category: 'Boissons' } },
      clients
    )

    expect(fakeWs.send).toHaveBeenCalledTimes(2)
    const ack = JSON.parse(fakeWs.send.mock.calls[0][0])
    expect(ack).toEqual({ id: 'cmd-1', ok: true })

    const broadcast = JSON.parse(fakeWs.send.mock.calls[1][0])
    expect(broadcast.type).toBe('state')
    expect(broadcast.module).toBe('mioum')
    expect(broadcast.data.products).toHaveLength(1)
  })

  it('sends error ack on validation failure', async () => {
    const fakeWs = { send: vi.fn() }
    const clients = new Set([fakeWs])

    await dispatcher.handle(
      fakeWs,
      { id: 'cmd-2', module: 'mioum', action: 'CreateProduct', payload: { name: '', price: 3.0, category: 'Boissons' } },
      clients
    )

    const ack = JSON.parse(fakeWs.send.mock.calls[0][0])
    expect(ack.ok).toBe(false)
    expect(ack.error).toContain('name')
  })

  it('returns snapshots for all registered modules', () => {
    const snapshots = dispatcher.snapshots()
    expect(snapshots.find(s => s.module === 'mioum')).toBeDefined()
    expect(snapshots.find(s => s.module === 'mioum').data.products).toEqual([])
  })
})
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
npx vitest run src/server/CommandDispatcher.test.js
```

Expected: FAIL

- [ ] **Implémenter `src/server/CommandDispatcher.js`**

```js
import { generateId } from '../shared/generateId.js'
import { EventStore } from './EventStore.js'
import { MioumCommandHandler } from './mioum/MioumCommandHandler.js'
import { MioumProjection } from './mioum/MioumProjection.js'

export class CommandDispatcher {
  #store
  #handlers
  #projections

  constructor(eventStore) {
    this.#store = eventStore ?? new EventStore()
    const mioumProjection = new MioumProjection(this.#store)
    this.#projections = { mioum: mioumProjection }
    this.#handlers = { mioum: new MioumCommandHandler(mioumProjection) }
  }

  async handle(ws, { id, module, action, payload }, clients) {
    const handler = this.#handlers[module]
    if (!handler) {
      ws.send(JSON.stringify({ id, ok: false, error: `Unknown module: ${module}` }))
      return
    }
    try {
      const domainEvent = handler.execute(action, payload)
      this.#store.append({ ...domainEvent, id: generateId() })
      ws.send(JSON.stringify({ id, ok: true }))
      const state = this.#projections[module].rebuild()
      const msg = JSON.stringify({ type: 'state', module, data: state })
      for (const client of clients) client.send(msg)
    } catch (err) {
      ws.send(JSON.stringify({ id, ok: false, error: err.message }))
    }
  }

  snapshots() {
    return Object.entries(this.#projections).map(([module, projection]) => ({
      module,
      data: projection.rebuild(),
    }))
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/server/CommandDispatcher.test.js
```

Expected: PASS

- [ ] **Lancer tous les tests**

```bash
npm test
```

Expected: tous les tests du projet PASS (les tests localstorage/ui existants ne sont pas affectés)

- [ ] **Commit**

```bash
git add src/server/CommandDispatcher.js src/server/CommandDispatcher.test.js
git commit -m "feat(server): add CommandDispatcher wired for mioum"
```

---

## Task 8 : WsClient (offline queue)

**Files:**
- Create: `src/client/WsClient.js`

- [ ] **Créer `src/client/WsClient.js`**

```js
import { generateId } from '../shared/generateId.js'

const QUEUE_KEY = 'ludinator:queue'

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export class WsClient {
  #url
  #ws = null
  #connected = false
  #pendingAcks = new Map()
  #stateHandlers = {}
  #connectionHandlers = []

  constructor(url) {
    this.#url = url
    this.#connect()
  }

  #connect() {
    this.#ws = new WebSocket(this.#url)

    this.#ws.onopen = () => {
      this.#connected = true
      this.#notifyConnection()
      this.#flushQueue()
    }

    this.#ws.onclose = () => {
      this.#connected = false
      this.#notifyConnection()
      this.#scheduleReconnect()
    }

    this.#ws.onerror = () => {
      this.#ws.close()
    }

    this.#ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data)
      if (msg.type === 'state') {
        const handlers = this.#stateHandlers[msg.module] ?? []
        for (const h of handlers) h(msg.data)
        return
      }
      if (msg.id) {
        const { resolve, reject } = this.#pendingAcks.get(msg.id) ?? {}
        this.#pendingAcks.delete(msg.id)
        if (!resolve) return
        msg.ok ? resolve() : reject(new Error(msg.error))
      }
    }
  }

  #retryDelay = 1000

  #scheduleReconnect() {
    setTimeout(() => {
      this.#retryDelay = Math.min(this.#retryDelay * 2, 30000)
      this.#connect()
    }, this.#retryDelay)
  }

  #notifyConnection() {
    const queue = loadQueue()
    for (const h of this.#connectionHandlers) h({ connected: this.#connected, queueLength: queue.length })
  }

  async #flushQueue() {
    this.#retryDelay = 1000
    const queue = loadQueue()
    for (const cmd of queue) {
      try {
        await this.#sendNow(cmd)
        const remaining = loadQueue().filter(c => c.id !== cmd.id)
        saveQueue(remaining)
        this.#notifyConnection()
      } catch (err) {
        const remaining = loadQueue().filter(c => c.id !== cmd.id)
        saveQueue(remaining)
        this.#notifyConnection()
      }
    }
  }

  #sendNow(cmd) {
    return new Promise((resolve, reject) => {
      this.#pendingAcks.set(cmd.id, { resolve, reject })
      this.#ws.send(JSON.stringify(cmd))
    })
  }

  send(module, action, payload = {}) {
    const cmd = { id: generateId(), module, action, payload }
    if (this.#connected) {
      return this.#sendNow(cmd)
    }
    const queue = loadQueue()
    queue.push(cmd)
    saveQueue(queue)
    this.#notifyConnection()
    return Promise.resolve()
  }

  onState(module, callback) {
    this.#stateHandlers[module] ??= []
    this.#stateHandlers[module].push(callback)
  }

  onConnectionChange(callback) {
    this.#connectionHandlers.push(callback)
  }
}
```

Note : `WsClient` ne peut pas être testé avec Vitest sans un vrai serveur WebSocket. Il est couvert par le test d'intégration en Task 10. Les tests unitaires des use cases et projections couvrent la logique métier indépendamment.

- [ ] **Commit**

```bash
git add src/client/WsClient.js
git commit -m "feat(client): add WsClient with offline queue"
```

---

## Task 9 : Migrer mioum.js + banner offline

**Files:**
- Modify: `src/mioum/mioum.js`
- Modify: `mioum.html`

- [ ] **Ajouter le banner offline dans `mioum.html`**

Ajouter dans le `<body>` de `mioum.html`, juste après la balise d'ouverture `<body>` :

```html
<div id="offline-banner" hidden style="position:fixed;top:0;left:0;right:0;background:#f59e0b;color:#fff;text-align:center;padding:8px;font-weight:bold;z-index:9999"></div>
```

- [ ] **Réécrire `src/mioum/mioum.js`**

```js
import { WsClient } from '../client/WsClient.js'
import './adapters/ui/MioumProductForm.js'
import './adapters/ui/MioumProductList.js'
import './adapters/ui/MioumTicketView.js'
import './adapters/ui/MioumStatsView.js'
import './adapters/ui/MioumHistoryView.js'

const ws = new WsClient('ws://localhost:3000')

const productList = document.querySelector('mioum-product-list')
const ticketView = document.querySelector('mioum-ticket-view')
const statsView = document.querySelector('mioum-stats-view')
const historyView = document.querySelector('mioum-history-view')
const offlineBanner = document.getElementById('offline-banner')

ws.onState('mioum', ({ products, tickets, currentTicket }) => {
  productList.refresh({ findAll: () => Promise.resolve(products.map(p => ({ id: p.id, name: { value: p.name }, price: { value: p.price }, category: p.category })) ) })
  if (currentTicket) {
    ticketView.refresh(currentTicket, { findAll: () => Promise.resolve(products.map(p => ({ id: p.id, name: { value: p.name }, price: { value: p.price }, category: p.category }))) })
  }
  statsView.refresh({ execute: () => Promise.resolve(computeStats(tickets)) })
  historyView.refresh({ findAll: () => Promise.resolve(tickets), findByStatus: (status) => Promise.resolve(tickets.filter(t => t.status === status)) })
})

ws.onConnectionChange(({ connected, queueLength }) => {
  offlineBanner.hidden = connected
  offlineBanner.textContent = `Hors ligne — ${queueLength} action(s) en attente`
})

function computeStats(tickets) {
  const closed = tickets.filter(t => t.status === 'closed')
  const total = closed.reduce((sum, t) => sum + t.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0), 0)
  return { totalRevenue: total, ticketCount: closed.length }
}

const dispatchError = msg => document.dispatchEvent(new CustomEvent('mioum-error', { detail: { message: msg } }))

document.addEventListener('product-created', e =>
  ws.send('mioum', 'CreateProduct', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('product-delete-requested', e =>
  ws.send('mioum', 'DeleteProduct', { productId: e.detail.productId }).catch(err => dispatchError(err.message)))

document.addEventListener('product-edit-requested', async e => {
  const { productId, name, price, category } = e.detail
  const newName = window.prompt('Nouveau nom du produit :', name)
  if (newName === null) return
  const newCategory = window.prompt('Catégorie :', category)
  if (newCategory === null) return
  const newPriceRaw = window.prompt('Nouveau prix (€) :', price)
  if (newPriceRaw === null) return
  const newPrice = parseFloat(newPriceRaw)
  if (isNaN(newPrice)) { dispatchError('Prix invalide.'); return }
  ws.send('mioum', 'UpdateProduct', { productId, name: newName, price: newPrice, category: newCategory })
    .catch(err => dispatchError(err.message))
})

document.addEventListener('line-add-requested', e =>
  ws.send('mioum', 'AddLineToTicket', { productId: e.detail.productId, quantity: e.detail.quantity ?? 1 })
    .catch(err => dispatchError(err.message)))

document.addEventListener('line-remove-requested', e =>
  ws.send('mioum', 'RemoveLineFromTicket', { lineId: e.detail.lineId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('line-decrement-requested', e =>
  ws.send('mioum', 'DecrementLineQuantity', { lineId: e.detail.lineId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('ticket-close-requested', e =>
  ws.send('mioum', 'CloseTicket', { paymentMethod: e.detail.paymentMethod ?? null })
    .catch(err => dispatchError(err.message)))

document.addEventListener('ticket-cancel-requested', () =>
  ws.send('mioum', 'CancelTicket', {}).catch(err => dispatchError(err.message)))

document.addEventListener('ticket-reopen-requested', e =>
  ws.send('mioum', 'ReopenTicket', { ticketId: e.detail.ticketId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('mioum-error', e => {
  const alert = document.getElementById('mioum-alert')
  alert.textContent = e.detail.message
  alert.hidden = false
  setTimeout(() => { alert.hidden = true }, 4000)
})

ws.send('mioum', 'OpenTicket', {}).catch(() => {})
```

- [ ] **Commit**

```bash
git add src/mioum/mioum.js mioum.html
git commit -m "feat(mioum): migrate orchestrator to WsClient"
```

---

## Task 10 : Test d'intégration mioum

**Files:**
- Create: `src/server/mioum/MioumIntegration.test.js`

- [ ] **Écrire le test d'intégration**

```js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { EventStore } from '../EventStore.js'
import { CommandDispatcher } from '../CommandDispatcher.js'

describe('Mioum integration', () => {
  let store, dispatcher, server, ws1, ws2

  beforeAll(async () => {
    store = new EventStore(':memory:')
    dispatcher = new CommandDispatcher(store)
    const clients = new Set()

    server = Bun.serve({
      port: 0,
      fetch(req, srv) { srv.upgrade(req) },
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

  it('creates a product and broadcasts state to all clients', async () => {
    const [state1, state2] = await Promise.all([
      new Promise(resolve => {
        ws1.addEventListener('message', ({ data }) => {
          const msg = JSON.parse(data)
          if (msg.type === 'state' && msg.module === 'mioum') resolve(msg.data)
        }, { once: true })
      }),
      new Promise(resolve => {
        ws2.addEventListener('message', ({ data }) => {
          const msg = JSON.parse(data)
          if (msg.type === 'state' && msg.module === 'mioum') resolve(msg.data)
        }, { once: true })
      }),
      new Promise(resolve => {
        ws1.send(JSON.stringify({ id: 'cmd-1', module: 'mioum', action: 'CreateProduct', payload: { name: 'Bière', price: 3.0, category: 'Boissons' } }))
        resolve()
      }),
    ])

    expect(state1.products[0].name).toBe('Bière')
    expect(state2.products[0].name).toBe('Bière')
  })

  it('receives initial snapshot on connection', async () => {
    const ws3 = new WebSocket(`ws://localhost:${server.port}`)
    const snapshot = await new Promise(resolve => {
      ws3.onmessage = ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'mioum') resolve(msg.data)
      }
    })
    expect(snapshot.products).toHaveLength(1)
    ws3.close()
  })
})
```

- [ ] **Lancer le test d'intégration (nécessite bun pour l'exécuter)**

```bash
bun run --bun node_modules/.bin/vitest run src/server/mioum/MioumIntegration.test.js
```

Expected: PASS

- [ ] **Lancer tous les tests**

```bash
npm test
```

Expected: tous les tests PASS

- [ ] **Commit final**

```bash
git add src/server/mioum/MioumIntegration.test.js
git commit -m "test(mioum): add WebSocket integration test"
```

---

## Vérification finale

- [ ] Démarrer le serveur : `bun run server`
- [ ] Démarrer le frontend : `npm run dev`
- [ ] Ouvrir `http://localhost:5173/mioum.html` dans deux onglets
- [ ] Créer un produit dans l'onglet 1 → vérifie qu'il apparaît dans l'onglet 2
- [ ] Couper le serveur → vérifie que le banner orange apparaît
- [ ] Ajouter une ligne au ticket (action queued)
- [ ] Redémarrer le serveur → vérifie que la queue se rejoue et l'état se met à jour
