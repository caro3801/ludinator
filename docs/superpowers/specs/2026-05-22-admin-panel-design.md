# Spec: Panneau Admin avec Reset de Base de Données

**Date:** 2026-05-22  
**Statut:** Approuvé  
**Auteur:** Utilisateur + Mistral Vibe

---

## 1. Contexte et Objectifs

### 1.1 Problème
Aucun moyen de réinitialiser la base de données SQLite en production. Nécessité pour :
- Réinitialiser l'environnement entre deux éditions de festival
- Corriger des erreurs de données
- Tester avec un état propre

### 1.2 Objectifs
- Créer un panneau admin accessible via `/admin`
- Permettre de réinitialiser la base **par module** (crew, fest, mioum)
- Authentification avec mot de passe stocké côté server
- Respecter l'architecture existante : DDD, Event Sourcing, CQRS, TDD

### 1.3 Non-objectifs
- Gestion multi-utilisateurs
- Audit des actions admin
- Sauvegarde/restauration de la base

---

## 2. Architecture (DDD + Event Sourcing + CQRS)

### 2.1 Principes respectés

| Principe | Application |
|----------|-------------|
| **DDD** | Séparation domain/application/infrastructure. Le reset est géré côté application (pas dans le domain). |
| **Event Sourcing** | Pas de DELETE. On ajoute un événement `ModuleResetInitiated`. Le replay ignore les événements avant le reset. |
| **CQRS** | Commandes (ResetModule) vs Query (CheckAdminSetup, AdminLogin). |
| **TDD** | Tests écrits avant l'implémentation pour chaque couche. |

### 2.2 Nouvel événement de domain

**Fichier:** `src/server/domain/events.ts`

```typescript
export interface ModuleResetInitiated {
  type: 'ModuleResetInitiated'
  module: 'crew' | 'fest' | 'mioum'
  initiatedAt: string
  initiatedBy: 'admin'
}
```

### 2.3 Modifications du EventStore

**Fichier:** `src/server/EventStore.ts`

Ajouter méthode :
```typescript
replayModuleSinceLastReset(module: string): Array<Event> {
  // 1. Trouver le dernier ModuleResetInitiated pour ce module
  // 2. Retourner tous les événements après cet événement
  // 3. Si aucun reset, retourner tous les événements
}
```

---

## 3. Structure des Fichiers

```
src/
├── server/
│   ├── domain/
│   │   ├── events.ts                  # + ModuleResetInitiated
│   │   └── value-objects/             # (futur)
│   ├── application/
│   │   ├── ports/
│   │   │   └── AdminRepository.ts     # Interface
│   │   ├── usecases/
│   │   │   ├── ResetModule.ts         # Orchestre le reset
│   │   │   └── AuthenticateAdmin.ts   # Vérifie le mot de passe
│   │   └── commands/
│   │       └── ResetModuleCommand.ts  # Commande CQRS
│   └── adapters/
│       ├── storage/
│       │   └── SqliteAdminRepository.ts # Implémente AdminRepository
│       └── handlers/
│           └── AdminCommandHandler.ts  # Gère les commandes admin
│   └── server.ts                      # Modifié : ajoute handler admin
├── admin/
│   └── ui/
│       └── AdminPanel.ts              # Composant Web Component
└── index.html, mioum.html, fest.html   # Ajout <admin-panel>
```

---

## 4. Backend : Détail d'implémentation

### 4.1 AdminRepository (Port)

**Fichier:** `src/server/application/ports/AdminRepository.ts`

```typescript
export interface AdminRepository {
  isSetupNeeded(): Promise<boolean>
  setupPassword(password: string): Promise<void>
  validatePassword(password: string): Promise<boolean>
}
```

### 4.2 SqliteAdminRepository (Adapter)

**Fichier:** `src/server/adapters/storage/SqliteAdminRepository.ts`

```typescript
import { Database } from 'bun:sqlite'
import { AdminRepository } from '../../application/ports/AdminRepository'

export class SqliteAdminRepository implements AdminRepository {
  #db: Database
  constructor(db: Database) { this.#db = db }
  
  async isSetupNeeded(): Promise<boolean> {
    const row = this.#db.query('SELECT COUNT(*) as count FROM admin_config').get() as { count: number }
    return row.count === 0
  }
  
  async setupPassword(password: string): Promise<void> {
    const hash = await this.#hashPassword(password)
    this.#db.run('INSERT INTO admin_config (id, password_hash) VALUES (?, ?)', ['admin', hash])
  }
  
  async validatePassword(password: string): Promise<boolean> {
    const row = this.#db.query('SELECT password_hash FROM admin_config WHERE id = ?').get('admin') as { password_hash: string }
    return await this.#verifyPassword(password, row?.password_hash || '')
  }
  
  async #hashPassword(pw: string): Promise<string> {
    const { hash } = await Bun.Crypto.hash(pw)
    return hash
  }
  
  async #verifyPassword(pw: string, hash: string): Promise<boolean> {
    const newHash = await this.#hashPassword(pw)
    return newHash === hash
  }
}
```

### 4.3 ResetModule (Use Case)

**Fichier:** `src/server/application/usecases/ResetModule.ts`

```typescript
import { EventStore } from '../../EventStore'
import { AdminRepository } from '../ports/AdminRepository'

export class ResetModule {
  constructor(
    private eventStore: EventStore,
    private adminRepo: AdminRepository
  ) {}
  
  async execute(module: 'crew' | 'fest' | 'mioum', password: string): Promise<void> {
    const isValid = await this.adminRepo.validatePassword(password)
    if (!isValid) throw new Error('Invalid password')
    
    this.eventStore.append({
      id: crypto.randomUUID(),
      module: 'admin',
      type: 'ModuleResetInitiated',
      aggregateId: null,
      payload: { module },
      occurredAt: new Date().toISOString()
    })
  }
}
```

### 4.4 AdminCommandHandler

**Fichier:** `src/server/adapters/handlers/AdminCommandHandler.ts`

```typescript
import { AdminRepository } from '../../application/ports/AdminRepository'
import { EventStore } from '../../EventStore'
import { ResetModule } from '../../application/usecases/ResetModule'

export class AdminCommandHandler {
  constructor(
    private adminRepo: AdminRepository,
    private eventStore: EventStore
  ) {}
  
  async handleCheckAdminSetup(): Promise<{ status: 'needs_setup' | 'ready' }> {
    const needsSetup = await this.adminRepo.isSetupNeeded()
    return { status: needsSetup ? 'needs_setup' : 'ready' }
  }
  
  async handleSetupAdmin(password: string): Promise<{ status: 'ok' }> {
    await this.adminRepo.setupPassword(password)
    return { status: 'ok' }
  }
  
  async handleAdminLogin(password: string): Promise<{ status: 'ok' | 'invalid' }> {
    const isValid = await this.adminRepo.validatePassword(password)
    return { status: isValid ? 'ok' : 'invalid' }
  }
  
  async handleResetModule(module: string, password: string): Promise<{ status: 'ok' | 'invalid_password' }> {
    const isValid = await this.adminRepo.validatePassword(password)
    if (!isValid) return { status: 'invalid_password' }
    await new ResetModule(this.eventStore, this.adminRepo).execute(module as 'crew' | 'fest' | 'mioum', password)
    return { status: 'ok' }
  }
}
```

### 4.5 Intégration dans server.ts

**Fichier:** `src/server/server.ts` - Modifications

```typescript
import { AdminCommandHandler } from './adapters/handlers/AdminCommandHandler'
import { SqliteAdminRepository } from './adapters/storage/SqliteAdminRepository'

// Initialisation
const eventStore = new EventStore()
const adminRepo = new SqliteAdminRepository(eventStore['#db'])
const adminHandler = new AdminCommandHandler(adminRepo, eventStore)

// Dans le websocket message handler :
if (cmd.module === 'admin') {
  switch (cmd.action) {
    case 'CheckAdminSetup':
      ws.send(JSON.stringify(await adminHandler.handleCheckAdminSetup()))
      break
    case 'SetupAdmin':
      ws.send(JSON.stringify(await adminHandler.handleSetupAdmin(cmd.payload.password)))
      break
    case 'AdminLogin':
      ws.send(JSON.stringify(await adminHandler.handleAdminLogin(cmd.payload.password)))
      break
    case 'ResetModule':
      ws.send(JSON.stringify(await adminHandler.handleResetModule(cmd.payload.module, cmd.payload.password)))
      break
  }
}
```

---

## 5. Frontend : Composant AdminPanel

### 5.1 AdminPanel.ts (Web Component)

**Fichier:** `src/admin/ui/AdminPanel.ts`

```typescript
import { WsClient } from '../../client/WsClient'

export class AdminPanel extends HTMLElement {
  #authenticated = false
  #needsSetup = true
  #ws: WsClient
  
  constructor() {
    super()
    this.#ws = new WsClient(`ws://${window.location.hostname}:3000`)
  }
  
  connectedCallback() {
    this.innerHTML = this.#render()
    this.#setupEventListeners()
    this.#checkAdminSetup()
  }
  
  #render(): string {
    if (this.#needsSetup) return this.#renderSetup()
    if (!this.#authenticated) return this.#renderLogin()
    return this.#renderActions()
  }
  
  #renderSetup(): string {
    return `
      <div class="card mt-4">
        <div class="card-header bg-warning">Configuration Admin</div>
        <div class="card-body">
          <p>Première configuration du panneau admin.</p>
          <form id="admin-setup-form">
            <div class="mb-3">
              <label class="form-label">Mot de passe admin</label>
              <input type="password" class="form-control" id="admin-password" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Confirmation</label>
              <input type="password" class="form-control" id="admin-confirm" required>
            </div>
            <button type="submit" class="btn btn-primary">Configurer</button>
          </form>
        </div>
      </div>
    `
  }
  
  #renderLogin(): string {
    return `
      <div class="card mt-4">
        <div class="card-header bg-primary text-white">Connexion Admin</div>
        <div class="card-body">
          <form id="admin-login-form">
            <div class="mb-3">
              <label class="form-label">Mot de passe</label>
              <input type="password" class="form-control" id="admin-login-password" required>
            </div>
            <button type="submit" class="btn btn-primary">Se connecter</button>
          </form>
        </div>
      </div>
    `
  }
  
  #renderActions(): string {
    return `
      <div class="card mt-4">
        <div class="card-header bg-dark text-white">Panneau Admin</div>
        <div class="card-body">
          <p>Réinitialiser un module :</p>
          <div class="mb-3">
            <select class="form-select" id="reset-module">
              <option value="crew">Crew (Bénévoles)</option>
              <option value="fest">Fest (Activités)</option>
              <option value="mioum">Mioum (Snack)</option>
            </select>
          </div>
          <button id="reset-btn" class="btn btn-danger">
            Réinitialiser ce module
          </button>
        </div>
      </div>
    `
  }
  
  #setupEventListeners() {
    // Setup form
    const setupForm = this.querySelector('#admin-setup-form')
    setupForm?.addEventListener('submit', (e) => {
      e.preventDefault()
      const password = (this.querySelector('#admin-password') as HTMLInputElement).value
      const confirm = (this.querySelector('#admin-confirm') as HTMLInputElement).value
      this.#handleSetup(password, confirm)
    })
    
    // Login form
    const loginForm = this.querySelector('#admin-login-form')
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault()
      const password = (this.querySelector('#admin-login-password') as HTMLInputElement).value
      this.#handleLogin(password)
    })
    
    // Reset button
    const resetBtn = this.querySelector('#reset-btn')
    resetBtn?.addEventListener('click', () => {
      const module = (this.querySelector('#reset-module') as HTMLSelectElement).value
      this.#handleReset(module)
    })
  }
  
  async #checkAdminSetup() {
    const resp = await this.#ws.send('admin', 'CheckAdminSetup', {})
    this.#needsSetup = resp.status === 'needs_setup'
    this.innerHTML = this.#render()
    this.#setupEventListeners()
  }
  
  async #handleSetup(password: string, confirm: string) {
    if (password !== confirm) {
      this.#showToast('Les mots de passe ne correspondent pas', 'error')
      return
    }
    if (password.length < 4) {
      this.#showToast('Mot de passe trop court', 'error')
      return
    }
    const resp = await this.#ws.send('admin', 'SetupAdmin', { password })
    if (resp.status === 'ok') {
      this.#needsSetup = false
      this.#showToast('Configuration admin terminée', 'success')
      this.innerHTML = this.#render()
      this.#setupEventListeners()
    }
  }
  
  async #handleLogin(password: string) {
    const resp = await this.#ws.send('admin', 'AdminLogin', { password })
    if (resp.status === 'ok') {
      this.#authenticated = true
      this.innerHTML = this.#render()
      this.#setupEventListeners()
    } else {
      this.#showToast('Mot de passe incorrect', 'error')
    }
  }
  
  async #handleReset(module: string) {
    const password = prompt('Confirmez avec le mot de passe admin :')
    if (!password) return
    
    const resp = await this.#ws.send('admin', 'ResetModule', { module, password })
    if (resp.status === 'ok') {
      // Réinitialiser le localStorage
      localStorage.clear()
      this.#showToast(`Module ${module} réinitialisé`, 'success')
      // Recharger pour obtenir l'état frais
      setTimeout(() => window.location.reload(), 1000)
    } else {
      this.#showToast('Mot de passe incorrect', 'error')
    }
  }
  
  #showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.createElement('div')
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`
    toast.style.position = 'fixed'
    toast.style.top = '20px'
    toast.style.right = '20px'
    toast.style.zIndex = '9999'
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `
    document.body.appendChild(toast)
    const bsToast = new (window as any).bootstrap.Toast(toast, { autohide: true, delay: 3000 })
    bsToast.show()
  }
}

customElements.define('admin-panel', AdminPanel)
```

### 5.2 Intégration dans les pages HTML

**Fichiers:** `index.html`, `mioum.html`, `fest.html`

Ajouter dans le `<body>` avant `</body>`:
```html
<script type="module" src="/src/admin/ui/AdminPanel.ts"></script>
<admin-panel></admin-panel>
```

---

## 6. Flux Utilisateur

```
Première visite :
  Accès /admin → CheckAdminSetup → needs_setup=true → Affiche formulaire setup
  
Visite normale :
  Accès /admin → CheckAdminSetup → needs_setup=false → Affiche login
  Login réussi → Affiche actions (reset par module)
  
Reset :
  Sélection module → Clic reset → Confirmation mot de passe → ResetModule → 
  localStorage.clear() → Toast succès → Recharge page
```

---

## 7. Sécurité

- Mot de passe **hashé** avec `Bun.Crypto.hash()`
- Stocké dans table SQLite `admin_config`
- Aucun mot de passe en clair dans le code ou les logs
- Chaque action nécessite le mot de passe

---

## 8. Tests (TDD)

### 8.1 Ordre d'implémentation

1. `SqliteAdminRepository.test.ts`
2. `ResetModule.test.ts`
3. `AdminCommandHandler.test.ts`
4. `AdminPanel.test.ts`

### 8.2 Exemples de tests

**SqliteAdminRepository.test.ts** :
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { SqliteAdminRepository } from './SqliteAdminRepository'
import { Database } from 'bun:sqlite'

describe('SqliteAdminRepository', () => {
  let repo: SqliteAdminRepository
  let db: Database
  
  beforeEach(() => {
    db = new Database(':memory:')
    db.run('CREATE TABLE admin_config (id TEXT PRIMARY KEY, password_hash TEXT NOT NULL)')
    repo = new SqliteAdminRepository(db)
  })
  
  it('returns true when no admin config exists', async () => {
    expect(await repo.isSetupNeeded()).toBe(true)
  })
  
  it('returns false after setup', async () => {
    await repo.setupPassword('secret123')
    expect(await repo.isSetupNeeded()).toBe(false)
  })
  
  it('validates correct password', async () => {
    await repo.setupPassword('secret123')
    expect(await repo.validatePassword('secret123')).toBe(true)
  })
  
  it('rejects incorrect password', async () => {
    await repo.setupPassword('secret123')
    expect(await repo.validatePassword('wrong')).toBe(false)
  })
})
```

**ResetModule.test.ts** :
```typescript
import { describe, it, expect } from 'vitest'
import { ResetModule } from './ResetModule'
import { EventStore } from '../EventStore'
import { AdminRepository } from '../ports/AdminRepository'

class MockAdminRepo implements AdminRepository {
  validate = true
  async isSetupNeeded(): Promise<boolean> { return false }
  async setupPassword(): Promise<void> {}
  async validatePassword(): Promise<boolean> { return this.validate }
}

class MockEventStore extends EventStore {
  lastEvent: any = null
  append(event: any): void {
    this.lastEvent = event
  }
}

describe('ResetModule', () => {
  it('throws when password is invalid', async () => {
    const adminRepo = new MockAdminRepo()
    adminRepo.validate = false
    const eventStore = new MockEventStore()
    const usecase = new ResetModule(eventStore as unknown as EventStore, adminRepo)
    await expect(usecase.execute('crew', 'wrong')).rejects.toThrow('Invalid password')
  })
  
  it('appends ModuleResetInitiated event on success', async () => {
    const adminRepo = new MockAdminRepo()
    const eventStore = new MockEventStore()
    const usecase = new ResetModule(eventStore as unknown as EventStore, adminRepo)
    await usecase.execute('crew', 'correct')
    expect(eventStore.lastEvent.type).toBe('ModuleResetInitiated')
    expect(eventStore.lastEvent.payload.module).toBe('crew')
  })
})
```

---

## 9. Checklist d'implémentation

- [ ] Créer `src/server/domain/events.ts` avec `ModuleResetInitiated`
- [ ] Modifier `src/server/EventStore.ts` : ajouter `replayModuleSinceLastReset()`
- [ ] Créer `src/server/application/ports/AdminRepository.ts`
- [ ] Créer `src/server/application/usecases/ResetModule.ts`
- [ ] Créer `src/server/application/usecases/AuthenticateAdmin.ts` (optionnel)
- [ ] Créer `src/server/adapters/storage/SqliteAdminRepository.ts`
- [ ] Créer `src/server/adapters/handlers/AdminCommandHandler.ts`
- [ ] Modifier `src/server/server.ts` : intégrer le handler admin
- [ ] Créer `src/admin/ui/AdminPanel.ts`
- [ ] Modifier `index.html`, `mioum.html`, `fest.html` : ajouter `<admin-panel>` + script
- [ ] Écrire tous les tests (TDD)
- [ ] Tester manuellement le flux complet

---

## 10. Estimations

| Tâche | Complexité | Temps estimé |
|-------|------------|--------------|
| Backend (repository, usecase, handler) | Moyenne | 1-2h |
| EventStore modifications | Faible | 30 min |
| Frontend (AdminPanel) | Moyenne | 1-2h |
| Intégration HTML | Faible | 15 min |
| Tests | Moyenne | 1-2h |
| **Total** | | **4-7h** |

---

**Statut : Approuvé par l'utilisateur**

> Pour commencer l'implémentation, invoker le skill `writing-plans`.

---

*Document généré via processus brainstorming*
*Co-Authored-By: Mistral Vibe <vibe@mistral.ai>*
