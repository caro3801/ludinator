# Crew — CQRS WebSocket Event-Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le module crew vers l'architecture CQRS event-ready : use cases purs retournant des domain events, projection reconstruisant l'état par replay, CommandHandler wired dans le serveur Bun existant.

**Architecture:** Le serveur Bun déjà en place (src/server/) gère les use cases purs, stocke les domain events dans SQLite, et broadcast l'état crew `{ volunteers, posts, schedule }` à tous les clients. Le navigateur envoie des commandes via le WsClient existant et reconstruit des objets domaine pour les composants UI qui en ont besoin.

**Tech Stack:** Bun (server + SQLite via `bun:sqlite`), Vitest, Vanilla JS (client)

---

## Fichiers créés / modifiés

### Nouveaux
- `src/crew/domain/events.js` — 11 domain event classes
- `src/server/crew/CrewProjection.js` — replay events → `{ volunteers, posts, schedule }`
- `src/server/crew/CrewCommandHandler.js` — exécute use cases purs crew
- `src/server/crew/CrewIntegration.test.js` — test intégration WebSocket

### Modifiés
- `src/crew/application/usecases/CreateVolunteer.js` + `.test.js`
- `src/crew/application/usecases/UpdateVolunteerName.js` + `.test.js`
- `src/crew/application/usecases/DeleteVolunteer.js` + `.test.js`
- `src/crew/application/usecases/CreatePost.js` + `.test.js`
- `src/crew/application/usecases/UpdatePostName.js` + `.test.js`
- `src/crew/application/usecases/DeletePost.js` + `.test.js`
- `src/crew/application/usecases/AddSlotToPost.js` + `.test.js`
- `src/crew/application/usecases/RemoveSlotFromPost.js` + `.test.js`
- `src/crew/application/usecases/UpdateSlotInPost.js` + `.test.js`
- `src/crew/application/usecases/AssignVolunteer.js` + `.test.js`
- `src/crew/application/usecases/UnassignVolunteer.js` + `.test.js`
- `src/server/CommandDispatcher.js` — ajout crew handler + projection
- `src/crew/crew.js` — remplacé : DOM events → WS commands, state broadcast → refresh
- `crew.html` — ajout banner offline

---

## Contexte technique important

**Modèles domaine (ne pas modifier) :**
- `Volunteer.create(name)` → `{ id, name: VolunteerName }` | `toJSON()` → `{ id, name: string }` | `fromJSON({ id, name })`
- `Post.create(name, minVolunteers)` → `{ id, name: PostName, minVolunteers, slots: [] }` | `toJSON()` → `{ id, name: string, minVolunteers, slots: [{id, postId, window: {day, startTime, endTime}}] }` | `fromJSON(...)` | `addSlot(window)` | `removeSlot(slotId)` | `updateSlotWindow(slotId, newWindow)`
- `Schedule.create(editionId)` → `{ id, editionId, assignments: [] }` | `toJSON()` → `{ id, editionId, assignments: [{id, volunteerId, slotId, window}] }` | `fromJSON(...)` | `assign(volunteer, slot)` | `removeAssignment(id)` | `removeAssignmentsForVolunteer(id)` | `getConflicts()` | `getAssignmentsForVolunteer(id)`
- `TimeWindow(day, startTime, endTime)` — throws si `startTime >= endTime` | `fromJSON({ day, startTime, endTime })`
- `TimeSlot.fromJSON({ id, postId, window })` — reconstruit un slot depuis un plain object

**EDITION_ID** : `'edition-2024'` — hardcodé dans CommandHandler et crew.js

**Pattern payload domain events crew :**
- Volunteer events : `payload = volunteer.toJSON()` (sauf `VolunteerDeleted` : `payload = { volunteerId }`)
- Post events : `payload = post.toJSON()` (sauf `PostDeleted` : `payload = { postId }` ; `SlotRemovedFromPost` : `payload = { post: post.toJSON(), slotId }`)
- Schedule events : `payload = schedule.toJSON()`

**Tests Bun :** Les tests qui utilisent `bun:sqlite` doivent être lancés avec :
```bash
~/.bun/bin/bun run --bun node_modules/.bin/vitest run <path>
```

---

## Task 1 : Domain events crew

**Files:**
- Create: `src/crew/domain/events.js`

- [ ] **Créer `src/crew/domain/events.js`**

```js
export class VolunteerCreated {
  constructor({ volunteer, occurredAt = new Date().toISOString() }) {
    this.type = 'VolunteerCreated'
    this.module = 'crew'
    this.aggregateId = volunteer.id
    this.payload = volunteer
    this.occurredAt = occurredAt
  }
}

export class VolunteerNameUpdated {
  constructor({ volunteer, occurredAt = new Date().toISOString() }) {
    this.type = 'VolunteerNameUpdated'
    this.module = 'crew'
    this.aggregateId = volunteer.id
    this.payload = volunteer
    this.occurredAt = occurredAt
  }
}

export class VolunteerDeleted {
  constructor({ volunteerId, occurredAt = new Date().toISOString() }) {
    this.type = 'VolunteerDeleted'
    this.module = 'crew'
    this.aggregateId = volunteerId
    this.payload = { volunteerId }
    this.occurredAt = occurredAt
  }
}

export class PostCreated {
  constructor({ post, occurredAt = new Date().toISOString() }) {
    this.type = 'PostCreated'
    this.module = 'crew'
    this.aggregateId = post.id
    this.payload = post
    this.occurredAt = occurredAt
  }
}

export class PostNameUpdated {
  constructor({ post, occurredAt = new Date().toISOString() }) {
    this.type = 'PostNameUpdated'
    this.module = 'crew'
    this.aggregateId = post.id
    this.payload = post
    this.occurredAt = occurredAt
  }
}

export class PostDeleted {
  constructor({ postId, occurredAt = new Date().toISOString() }) {
    this.type = 'PostDeleted'
    this.module = 'crew'
    this.aggregateId = postId
    this.payload = { postId }
    this.occurredAt = occurredAt
  }
}

export class SlotAddedToPost {
  constructor({ post, occurredAt = new Date().toISOString() }) {
    this.type = 'SlotAddedToPost'
    this.module = 'crew'
    this.aggregateId = post.id
    this.payload = post
    this.occurredAt = occurredAt
  }
}

export class SlotRemovedFromPost {
  constructor({ post, slotId, occurredAt = new Date().toISOString() }) {
    this.type = 'SlotRemovedFromPost'
    this.module = 'crew'
    this.aggregateId = post.id
    this.payload = { post, slotId }
    this.occurredAt = occurredAt
  }
}

export class SlotUpdatedInPost {
  constructor({ post, occurredAt = new Date().toISOString() }) {
    this.type = 'SlotUpdatedInPost'
    this.module = 'crew'
    this.aggregateId = post.id
    this.payload = post
    this.occurredAt = occurredAt
  }
}

export class VolunteerAssigned {
  constructor({ schedule, occurredAt = new Date().toISOString() }) {
    this.type = 'VolunteerAssigned'
    this.module = 'crew'
    this.aggregateId = schedule.id
    this.payload = schedule
    this.occurredAt = occurredAt
  }
}

export class VolunteerUnassigned {
  constructor({ schedule, occurredAt = new Date().toISOString() }) {
    this.type = 'VolunteerUnassigned'
    this.module = 'crew'
    this.aggregateId = schedule.id
    this.payload = schedule
    this.occurredAt = occurredAt
  }
}
```

- [ ] **Commit**

```bash
git add src/crew/domain/events.js
git commit -m "feat(crew): add domain events"
```

---

## Task 2 : Refactoring use cases crew (purs)

**Files:** tous les `src/crew/application/usecases/*.js` et leurs tests

### 2a — CreateVolunteer

- [ ] **Réécrire `CreateVolunteer.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { CreateVolunteer } from './CreateVolunteer.js'
import { VolunteerCreated } from '../../domain/events.js'

describe('CreateVolunteer', () => {
  it('emits VolunteerCreated with correct name', () => {
    const event = new CreateVolunteer().execute({ name: 'Alice' })
    expect(event).toBeInstanceOf(VolunteerCreated)
    expect(event.payload.name).toBe('Alice')
  })

  it('throws on empty name', () => {
    expect(() => new CreateVolunteer().execute({ name: '' })).toThrow()
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npx vitest run src/crew/application/usecases/CreateVolunteer.test.js
```

- [ ] **Réécrire `CreateVolunteer.js`**

```js
import { Volunteer } from '../../domain/model/Volunteer.js'
import { VolunteerCreated } from '../../domain/events.js'

export class CreateVolunteer {
  execute({ name }) {
    const volunteer = Volunteer.create(name)
    return new VolunteerCreated({ volunteer: volunteer.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/CreateVolunteer.test.js
```

Expected: PASS

### 2b — UpdateVolunteerName

- [ ] **Réécrire `UpdateVolunteerName.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { UpdateVolunteerName } from './UpdateVolunteerName.js'
import { VolunteerNameUpdated } from '../../domain/events.js'
import { Volunteer } from '../../domain/model/Volunteer.js'

describe('UpdateVolunteerName', () => {
  it('emits VolunteerNameUpdated with new name', () => {
    const volunteer = Volunteer.create('Alice').toJSON()
    const event = new UpdateVolunteerName().execute({ volunteer, name: 'Bob' })
    expect(event).toBeInstanceOf(VolunteerNameUpdated)
    expect(event.payload.name).toBe('Bob')
  })

  it('throws on empty name', () => {
    const volunteer = Volunteer.create('Alice').toJSON()
    expect(() => new UpdateVolunteerName().execute({ volunteer, name: '' })).toThrow()
  })
})
```

- [ ] **Réécrire `UpdateVolunteerName.js`**

```js
import { Volunteer } from '../../domain/model/Volunteer.js'
import { VolunteerNameUpdated } from '../../domain/events.js'

export class UpdateVolunteerName {
  execute({ volunteer: volunteerData, name }) {
    const volunteer = Volunteer.fromJSON(volunteerData)
    volunteer.updateName(name)
    return new VolunteerNameUpdated({ volunteer: volunteer.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/UpdateVolunteerName.test.js
```

Expected: PASS

### 2c — DeleteVolunteer

Note : la suppression en cascade des assignments est gérée dans la projection. Le use case est trivial.

- [ ] **Réécrire `DeleteVolunteer.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { DeleteVolunteer } from './DeleteVolunteer.js'
import { VolunteerDeleted } from '../../domain/events.js'

describe('DeleteVolunteer', () => {
  it('emits VolunteerDeleted with correct volunteerId', () => {
    const event = new DeleteVolunteer().execute({ volunteerId: 'v-1' })
    expect(event).toBeInstanceOf(VolunteerDeleted)
    expect(event.payload.volunteerId).toBe('v-1')
  })
})
```

- [ ] **Réécrire `DeleteVolunteer.js`**

```js
import { VolunteerDeleted } from '../../domain/events.js'

export class DeleteVolunteer {
  execute({ volunteerId }) {
    return new VolunteerDeleted({ volunteerId })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/DeleteVolunteer.test.js
```

Expected: PASS

### 2d — CreatePost

- [ ] **Réécrire `CreatePost.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { CreatePost } from './CreatePost.js'
import { PostCreated } from '../../domain/events.js'

describe('CreatePost', () => {
  it('emits PostCreated with correct data', () => {
    const event = new CreatePost().execute({ name: 'Accueil', minVolunteers: 2 })
    expect(event).toBeInstanceOf(PostCreated)
    expect(event.payload.name).toBe('Accueil')
    expect(event.payload.minVolunteers).toBe(2)
    expect(event.payload.slots).toEqual([])
  })

  it('throws on empty name', () => {
    expect(() => new CreatePost().execute({ name: '', minVolunteers: 2 })).toThrow()
  })

  it('throws when minVolunteers < 1', () => {
    expect(() => new CreatePost().execute({ name: 'Bar', minVolunteers: 0 })).toThrow()
  })
})
```

- [ ] **Réécrire `CreatePost.js`**

```js
import { Post } from '../../domain/model/Post.js'
import { PostCreated } from '../../domain/events.js'

export class CreatePost {
  execute({ name, minVolunteers }) {
    const post = Post.create(name, minVolunteers)
    return new PostCreated({ post: post.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/CreatePost.test.js
```

Expected: PASS

### 2e — UpdatePostName

- [ ] **Réécrire `UpdatePostName.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { UpdatePostName } from './UpdatePostName.js'
import { PostNameUpdated } from '../../domain/events.js'
import { Post } from '../../domain/model/Post.js'

describe('UpdatePostName', () => {
  it('emits PostNameUpdated with new name', () => {
    const post = Post.create('Accueil', 2).toJSON()
    const event = new UpdatePostName().execute({ post, name: 'Bar' })
    expect(event).toBeInstanceOf(PostNameUpdated)
    expect(event.payload.name).toBe('Bar')
  })

  it('throws on empty name', () => {
    const post = Post.create('Accueil', 2).toJSON()
    expect(() => new UpdatePostName().execute({ post, name: '' })).toThrow()
  })
})
```

- [ ] **Réécrire `UpdatePostName.js`**

```js
import { Post } from '../../domain/model/Post.js'
import { PostNameUpdated } from '../../domain/events.js'

export class UpdatePostName {
  execute({ post: postData, name }) {
    const post = Post.fromJSON(postData)
    post.updateName(name)
    return new PostNameUpdated({ post: post.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/UpdatePostName.test.js
```

Expected: PASS

### 2f — DeletePost

Note : la suppression en cascade des assignments est gérée dans la projection.

- [ ] **Réécrire `DeletePost.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { DeletePost } from './DeletePost.js'
import { PostDeleted } from '../../domain/events.js'

describe('DeletePost', () => {
  it('emits PostDeleted with correct postId', () => {
    const event = new DeletePost().execute({ postId: 'p-1' })
    expect(event).toBeInstanceOf(PostDeleted)
    expect(event.payload.postId).toBe('p-1')
  })
})
```

- [ ] **Réécrire `DeletePost.js`**

```js
import { PostDeleted } from '../../domain/events.js'

export class DeletePost {
  execute({ postId }) {
    return new PostDeleted({ postId })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/DeletePost.test.js
```

Expected: PASS

### 2g — AddSlotToPost

- [ ] **Réécrire `AddSlotToPost.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { AddSlotToPost } from './AddSlotToPost.js'
import { SlotAddedToPost } from '../../domain/events.js'
import { Post } from '../../domain/model/Post.js'

describe('AddSlotToPost', () => {
  it('emits SlotAddedToPost with updated slots', () => {
    const post = Post.create('Accueil', 2).toJSON()
    const event = new AddSlotToPost().execute({ post, day: 'samedi', startTime: '09:00', endTime: '12:00' })
    expect(event).toBeInstanceOf(SlotAddedToPost)
    expect(event.payload.slots).toHaveLength(1)
    expect(event.payload.slots[0].window.day).toBe('samedi')
  })

  it('throws when startTime >= endTime', () => {
    const post = Post.create('Accueil', 2).toJSON()
    expect(() => new AddSlotToPost().execute({ post, day: 'samedi', startTime: '12:00', endTime: '09:00' })).toThrow()
  })
})
```

- [ ] **Réécrire `AddSlotToPost.js`**

```js
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'
import { SlotAddedToPost } from '../../domain/events.js'

export class AddSlotToPost {
  execute({ post: postData, day, startTime, endTime }) {
    const post = Post.fromJSON(postData)
    post.addSlot(new TimeWindow(day, startTime, endTime))
    return new SlotAddedToPost({ post: post.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/AddSlotToPost.test.js
```

Expected: PASS

### 2h — RemoveSlotFromPost

- [ ] **Réécrire `RemoveSlotFromPost.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { RemoveSlotFromPost } from './RemoveSlotFromPost.js'
import { SlotRemovedFromPost } from '../../domain/events.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('RemoveSlotFromPost', () => {
  it('emits SlotRemovedFromPost with slot removed from post and slotId in payload', () => {
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slotId = p.slots[0].id
    const event = new RemoveSlotFromPost().execute({ post: p.toJSON(), slotId })
    expect(event).toBeInstanceOf(SlotRemovedFromPost)
    expect(event.payload.post.slots).toHaveLength(0)
    expect(event.payload.slotId).toBe(slotId)
  })
})
```

- [ ] **Réécrire `RemoveSlotFromPost.js`**

```js
import { Post } from '../../domain/model/Post.js'
import { SlotRemovedFromPost } from '../../domain/events.js'

export class RemoveSlotFromPost {
  execute({ post: postData, slotId }) {
    const post = Post.fromJSON(postData)
    post.removeSlot(slotId)
    return new SlotRemovedFromPost({ post: post.toJSON(), slotId })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/RemoveSlotFromPost.test.js
```

Expected: PASS

### 2i — UpdateSlotInPost

- [ ] **Réécrire `UpdateSlotInPost.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { UpdateSlotInPost } from './UpdateSlotInPost.js'
import { SlotUpdatedInPost } from '../../domain/events.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('UpdateSlotInPost', () => {
  it('emits SlotUpdatedInPost with updated window', () => {
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slotId = p.slots[0].id
    const event = new UpdateSlotInPost().execute({ post: p.toJSON(), slotId, day: 'dimanche', startTime: '10:00', endTime: '14:00' })
    expect(event).toBeInstanceOf(SlotUpdatedInPost)
    expect(event.payload.slots[0].window.day).toBe('dimanche')
    expect(event.payload.slots[0].window.startTime).toBe('10:00')
  })

  it('throws when slotId not found', () => {
    const post = Post.create('Accueil', 2).toJSON()
    expect(() => new UpdateSlotInPost().execute({ post, slotId: 'unknown', day: 'samedi', startTime: '09:00', endTime: '12:00' })).toThrow()
  })
})
```

- [ ] **Réécrire `UpdateSlotInPost.js`**

```js
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'
import { SlotUpdatedInPost } from '../../domain/events.js'

export class UpdateSlotInPost {
  execute({ post: postData, slotId, day, startTime, endTime }) {
    const post = Post.fromJSON(postData)
    post.updateSlotWindow(slotId, new TimeWindow(day, startTime, endTime))
    return new SlotUpdatedInPost({ post: post.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/UpdateSlotInPost.test.js
```

Expected: PASS

### 2j — AssignVolunteer

- [ ] **Réécrire `AssignVolunteer.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { AssignVolunteer } from './AssignVolunteer.js'
import { VolunteerAssigned } from '../../domain/events.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('AssignVolunteer', () => {
  it('emits VolunteerAssigned with assignment in schedule', () => {
    const volunteer = Volunteer.create('Alice').toJSON()
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slot = p.slots[0].toJSON()
    const event = new AssignVolunteer().execute({ volunteer, slot, schedule: null, editionId: 'edition-2024' })
    expect(event).toBeInstanceOf(VolunteerAssigned)
    expect(event.payload.editionId).toBe('edition-2024')
    expect(event.payload.assignments).toHaveLength(1)
    expect(event.payload.assignments[0].volunteerId).toBe(volunteer.id)
    expect(event.payload.assignments[0].slotId).toBe(slot.id)
  })

  it('adds to existing schedule when provided', () => {
    const v1 = Volunteer.create('Alice').toJSON()
    const v2 = Volunteer.create('Bob').toJSON()
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    p.addSlot(new TimeWindow('samedi', '14:00', '17:00'))
    const slot1 = p.slots[0].toJSON()
    const slot2 = p.slots[1].toJSON()

    const first = new AssignVolunteer().execute({ volunteer: v1, slot: slot1, schedule: null, editionId: 'edition-2024' })
    const second = new AssignVolunteer().execute({ volunteer: v2, slot: slot2, schedule: first.payload, editionId: 'edition-2024' })
    expect(second.payload.assignments).toHaveLength(2)
  })
})
```

- [ ] **Réécrire `AssignVolunteer.js`**

```js
import { Volunteer } from '../../domain/model/Volunteer.js'
import { TimeSlot } from '../../domain/model/TimeSlot.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { VolunteerAssigned } from '../../domain/events.js'

export class AssignVolunteer {
  execute({ volunteer: volunteerData, slot: slotData, schedule: scheduleData, editionId }) {
    const volunteer = Volunteer.fromJSON(volunteerData)
    const slot = TimeSlot.fromJSON(slotData)
    const schedule = scheduleData ? Schedule.fromJSON(scheduleData) : Schedule.create(editionId)
    schedule.assign(volunteer, slot)
    return new VolunteerAssigned({ schedule: schedule.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/AssignVolunteer.test.js
```

Expected: PASS

### 2k — UnassignVolunteer

- [ ] **Réécrire `UnassignVolunteer.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { UnassignVolunteer } from './UnassignVolunteer.js'
import { VolunteerUnassigned } from '../../domain/events.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('UnassignVolunteer', () => {
  it('emits VolunteerUnassigned with assignment removed', () => {
    const volunteer = Volunteer.create('Alice')
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slot = p.slots[0]
    const schedule = Schedule.create('edition-2024')
    schedule.assign(volunteer, slot)
    const assignmentId = schedule.toJSON().assignments[0].id

    const event = new UnassignVolunteer().execute({ schedule: schedule.toJSON(), assignmentId })
    expect(event).toBeInstanceOf(VolunteerUnassigned)
    expect(event.payload.assignments).toHaveLength(0)
  })
})
```

- [ ] **Réécrire `UnassignVolunteer.js`**

```js
import { Schedule } from '../../domain/model/Schedule.js'
import { VolunteerUnassigned } from '../../domain/events.js'

export class UnassignVolunteer {
  execute({ schedule: scheduleData, assignmentId }) {
    const schedule = Schedule.fromJSON(scheduleData)
    schedule.removeAssignment(assignmentId)
    return new VolunteerUnassigned({ schedule: schedule.toJSON() })
  }
}
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/crew/application/usecases/UnassignVolunteer.test.js
```

Expected: PASS

- [ ] **Lancer tous les tests crew**

```bash
npx vitest run src/crew/application/usecases/
```

Expected: tous les tests PASS

- [ ] **Commit**

```bash
git add src/crew/domain/events.js src/crew/application/usecases/
git commit -m "feat(crew): refactor use cases to pure domain-event emitters"
```

---

## Task 3 : CrewProjection

**Files:**
- Create: `src/server/crew/CrewProjection.js`
- Create: `src/server/crew/CrewProjection.test.js`

- [ ] **Créer `src/server/crew/CrewProjection.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { CrewProjection } from './CrewProjection.js'
import { EventStore } from '../EventStore.js'
import { Volunteer } from '../../crew/domain/model/Volunteer.js'
import { Post } from '../../crew/domain/model/Post.js'
import { Schedule } from '../../crew/domain/model/Schedule.js'
import { TimeWindow } from '../../crew/domain/model/TimeWindow.js'

describe('CrewProjection', () => {
  it('starts with empty state', () => {
    const store = new EventStore(':memory:')
    const state = new CrewProjection(store).rebuild()
    expect(state.volunteers).toEqual([])
    expect(state.posts).toEqual([])
    expect(state.schedule).toBeNull()
  })

  it('adds volunteer from VolunteerCreated', () => {
    const store = new EventStore(':memory:')
    const volunteer = Volunteer.create('Alice').toJSON()
    store.append({ id: '1', module: 'crew', type: 'VolunteerCreated', aggregateId: volunteer.id, payload: volunteer, occurredAt: new Date().toISOString() })
    const state = new CrewProjection(store).rebuild()
    expect(state.volunteers).toHaveLength(1)
    expect(state.volunteers[0].name).toBe('Alice')
  })

  it('removes volunteer from VolunteerDeleted and cascades assignments', () => {
    const store = new EventStore(':memory:')
    const volunteer = Volunteer.create('Alice')
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slot = p.slots[0]
    const schedule = Schedule.create('edition-2024')
    schedule.assign(volunteer, slot)

    store.append({ id: '1', module: 'crew', type: 'VolunteerCreated', aggregateId: volunteer.id, payload: volunteer.toJSON(), occurredAt: '2024-01-01T10:00:00.000Z' })
    store.append({ id: '2', module: 'crew', type: 'VolunteerAssigned', aggregateId: schedule.id, payload: schedule.toJSON(), occurredAt: '2024-01-01T10:00:01.000Z' })
    store.append({ id: '3', module: 'crew', type: 'VolunteerDeleted', aggregateId: volunteer.id, payload: { volunteerId: volunteer.id }, occurredAt: '2024-01-01T10:00:02.000Z' })

    const state = new CrewProjection(store).rebuild()
    expect(state.volunteers).toHaveLength(0)
    expect(state.schedule.assignments).toHaveLength(0)
  })

  it('adds post from PostCreated', () => {
    const store = new EventStore(':memory:')
    const post = Post.create('Bar', 1).toJSON()
    store.append({ id: '1', module: 'crew', type: 'PostCreated', aggregateId: post.id, payload: post, occurredAt: new Date().toISOString() })
    const state = new CrewProjection(store).rebuild()
    expect(state.posts).toHaveLength(1)
    expect(state.posts[0].name).toBe('Bar')
  })

  it('removes post from PostDeleted and cascades slot assignments', () => {
    const store = new EventStore(':memory:')
    const volunteer = Volunteer.create('Alice')
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slot = p.slots[0]
    const schedule = Schedule.create('edition-2024')
    schedule.assign(volunteer, slot)

    store.append({ id: '1', module: 'crew', type: 'PostCreated', aggregateId: p.id, payload: p.toJSON(), occurredAt: '2024-01-01T10:00:00.000Z' })
    store.append({ id: '2', module: 'crew', type: 'VolunteerAssigned', aggregateId: schedule.id, payload: schedule.toJSON(), occurredAt: '2024-01-01T10:00:01.000Z' })
    store.append({ id: '3', module: 'crew', type: 'PostDeleted', aggregateId: p.id, payload: { postId: p.id }, occurredAt: '2024-01-01T10:00:02.000Z' })

    const state = new CrewProjection(store).rebuild()
    expect(state.posts).toHaveLength(0)
    expect(state.schedule.assignments).toHaveLength(0)
  })

  it('tracks assignment in schedule from VolunteerAssigned', () => {
    const store = new EventStore(':memory:')
    const volunteer = Volunteer.create('Alice')
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slot = p.slots[0]
    const schedule = Schedule.create('edition-2024')
    schedule.assign(volunteer, slot)

    store.append({ id: '1', module: 'crew', type: 'VolunteerAssigned', aggregateId: schedule.id, payload: schedule.toJSON(), occurredAt: new Date().toISOString() })
    const state = new CrewProjection(store).rebuild()
    expect(state.schedule).not.toBeNull()
    expect(state.schedule.assignments).toHaveLength(1)
  })
})
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
~/.bun/bin/bun run --bun node_modules/.bin/vitest run src/server/crew/CrewProjection.test.js
```

Expected: FAIL — CrewProjection not found

- [ ] **Implémenter `src/server/crew/CrewProjection.js`**

```js
const INITIAL_STATE = { volunteers: [], posts: [], schedule: null }

function applyEvent(state, event) {
  switch (event.type) {
    case 'VolunteerCreated':
      return { ...state, volunteers: [...state.volunteers, event.payload] }

    case 'VolunteerNameUpdated':
      return { ...state, volunteers: state.volunteers.map(v => v.id === event.payload.id ? event.payload : v) }

    case 'VolunteerDeleted':
      return {
        ...state,
        volunteers: state.volunteers.filter(v => v.id !== event.payload.volunteerId),
        schedule: state.schedule
          ? { ...state.schedule, assignments: state.schedule.assignments.filter(a => a.volunteerId !== event.payload.volunteerId) }
          : null,
      }

    case 'PostCreated':
      return { ...state, posts: [...state.posts, event.payload] }

    case 'PostNameUpdated':
    case 'SlotAddedToPost':
    case 'SlotUpdatedInPost':
      return { ...state, posts: state.posts.map(p => p.id === event.payload.id ? event.payload : p) }

    case 'PostDeleted': {
      const post = state.posts.find(p => p.id === event.payload.postId)
      const slotIds = post ? post.slots.map(s => s.id) : []
      return {
        ...state,
        posts: state.posts.filter(p => p.id !== event.payload.postId),
        schedule: state.schedule
          ? { ...state.schedule, assignments: state.schedule.assignments.filter(a => !slotIds.includes(a.slotId)) }
          : null,
      }
    }

    case 'SlotRemovedFromPost':
      return {
        ...state,
        posts: state.posts.map(p => p.id === event.payload.post.id ? event.payload.post : p),
        schedule: state.schedule
          ? { ...state.schedule, assignments: state.schedule.assignments.filter(a => a.slotId !== event.payload.slotId) }
          : null,
      }

    case 'VolunteerAssigned':
    case 'VolunteerUnassigned':
      return { ...state, schedule: event.payload }

    default:
      return state
  }
}

export class CrewProjection {
  #store

  constructor(eventStore) {
    this.#store = eventStore
  }

  rebuild() {
    const events = this.#store.replayModule('crew')
    return events.reduce(applyEvent, INITIAL_STATE)
  }
}
```

- [ ] **Lancer les tests**

```bash
~/.bun/bin/bun run --bun node_modules/.bin/vitest run src/server/crew/CrewProjection.test.js
```

Expected: 5 tests PASS

- [ ] **Commit**

```bash
git add src/server/crew/CrewProjection.js src/server/crew/CrewProjection.test.js
git commit -m "feat(server): add CrewProjection"
```

---

## Task 4 : CrewCommandHandler

**Files:**
- Create: `src/server/crew/CrewCommandHandler.js`
- Create: `src/server/crew/CrewCommandHandler.test.js`

- [ ] **Créer `src/server/crew/CrewCommandHandler.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { CrewCommandHandler } from './CrewCommandHandler.js'
import { CrewProjection } from './CrewProjection.js'
import { EventStore } from '../EventStore.js'

describe('CrewCommandHandler', () => {
  let store, projection, handler

  beforeEach(() => {
    store = new EventStore(':memory:')
    projection = new CrewProjection(store)
    handler = new CrewCommandHandler(projection)
  })

  it('CreateVolunteer returns VolunteerCreated', () => {
    const event = handler.execute('CreateVolunteer', { name: 'Alice' })
    expect(event.type).toBe('VolunteerCreated')
    expect(event.payload.name).toBe('Alice')
  })

  it('UpdateVolunteerName throws when volunteer not found', () => {
    expect(() => handler.execute('UpdateVolunteerName', { volunteerId: 'x', name: 'Bob' }))
      .toThrow('Volunteer not found')
  })

  it('CreatePost returns PostCreated', () => {
    const event = handler.execute('CreatePost', { name: 'Accueil', minVolunteers: 2 })
    expect(event.type).toBe('PostCreated')
    expect(event.payload.name).toBe('Accueil')
  })

  it('AddSlotToPost throws when post not found', () => {
    expect(() => handler.execute('AddSlotToPost', { postId: 'x', day: 'samedi', startTime: '09:00', endTime: '12:00' }))
      .toThrow('Post not found')
  })

  it('AssignVolunteer throws when volunteer not found', () => {
    expect(() => handler.execute('AssignVolunteer', { volunteerId: 'x', slotId: 'y' }))
      .toThrow('Volunteer not found')
  })

  it('AssignVolunteer throws when slot not found', () => {
    const created = handler.execute('CreateVolunteer', { name: 'Alice' })
    store.append({ ...created, id: '1' })
    const volunteerId = projection.rebuild().volunteers[0].id
    expect(() => handler.execute('AssignVolunteer', { volunteerId, slotId: 'unknown' }))
      .toThrow('Slot not found')
  })

  it('full flow: create post, add slot, create volunteer, assign', () => {
    const postEvent = handler.execute('CreatePost', { name: 'Accueil', minVolunteers: 2 })
    store.append({ ...postEvent, id: '1' })

    const slotEvent = handler.execute('AddSlotToPost', {
      postId: projection.rebuild().posts[0].id,
      day: 'samedi', startTime: '09:00', endTime: '12:00',
    })
    store.append({ ...slotEvent, id: '2' })

    const volEvent = handler.execute('CreateVolunteer', { name: 'Alice' })
    store.append({ ...volEvent, id: '3' })

    const state = projection.rebuild()
    const volunteerId = state.volunteers[0].id
    const slotId = state.posts[0].slots[0].id

    const assignEvent = handler.execute('AssignVolunteer', { volunteerId, slotId })
    expect(assignEvent.type).toBe('VolunteerAssigned')
    expect(assignEvent.payload.assignments).toHaveLength(1)
  })

  it('throws on unknown action', () => {
    expect(() => handler.execute('UnknownAction', {})).toThrow('Unknown action')
  })
})
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
~/.bun/bin/bun run --bun node_modules/.bin/vitest run src/server/crew/CrewCommandHandler.test.js
```

Expected: FAIL

- [ ] **Implémenter `src/server/crew/CrewCommandHandler.js`**

```js
import { CreateVolunteer } from '../../crew/application/usecases/CreateVolunteer.js'
import { UpdateVolunteerName } from '../../crew/application/usecases/UpdateVolunteerName.js'
import { DeleteVolunteer } from '../../crew/application/usecases/DeleteVolunteer.js'
import { CreatePost } from '../../crew/application/usecases/CreatePost.js'
import { UpdatePostName } from '../../crew/application/usecases/UpdatePostName.js'
import { DeletePost } from '../../crew/application/usecases/DeletePost.js'
import { AddSlotToPost } from '../../crew/application/usecases/AddSlotToPost.js'
import { RemoveSlotFromPost } from '../../crew/application/usecases/RemoveSlotFromPost.js'
import { UpdateSlotInPost } from '../../crew/application/usecases/UpdateSlotInPost.js'
import { AssignVolunteer } from '../../crew/application/usecases/AssignVolunteer.js'
import { UnassignVolunteer } from '../../crew/application/usecases/UnassignVolunteer.js'

const EDITION_ID = 'edition-2024'

export class CrewCommandHandler {
  #projection

  constructor(projection) {
    this.#projection = projection
  }

  execute(action, payload) {
    const state = this.#projection.rebuild()

    switch (action) {
      case 'CreateVolunteer':
        return new CreateVolunteer().execute(payload)

      case 'UpdateVolunteerName': {
        const volunteer = state.volunteers.find(v => v.id === payload.volunteerId)
        if (!volunteer) throw new Error(`Volunteer not found: ${payload.volunteerId}`)
        return new UpdateVolunteerName().execute({ volunteer, name: payload.name })
      }

      case 'DeleteVolunteer':
        return new DeleteVolunteer().execute(payload)

      case 'CreatePost':
        return new CreatePost().execute(payload)

      case 'UpdatePostName': {
        const post = state.posts.find(p => p.id === payload.postId)
        if (!post) throw new Error(`Post not found: ${payload.postId}`)
        return new UpdatePostName().execute({ post, name: payload.name })
      }

      case 'DeletePost':
        return new DeletePost().execute(payload)

      case 'AddSlotToPost': {
        const post = state.posts.find(p => p.id === payload.postId)
        if (!post) throw new Error(`Post not found: ${payload.postId}`)
        return new AddSlotToPost().execute({ post, day: payload.day, startTime: payload.startTime, endTime: payload.endTime })
      }

      case 'RemoveSlotFromPost': {
        const post = state.posts.find(p => p.id === payload.postId)
        if (!post) throw new Error(`Post not found: ${payload.postId}`)
        return new RemoveSlotFromPost().execute({ post, slotId: payload.slotId })
      }

      case 'UpdateSlotInPost': {
        const post = state.posts.find(p => p.id === payload.postId)
        if (!post) throw new Error(`Post not found: ${payload.postId}`)
        return new UpdateSlotInPost().execute({ post, slotId: payload.slotId, day: payload.day, startTime: payload.startTime, endTime: payload.endTime })
      }

      case 'AssignVolunteer': {
        const volunteer = state.volunteers.find(v => v.id === payload.volunteerId)
        if (!volunteer) throw new Error(`Volunteer not found: ${payload.volunteerId}`)
        let slot = null
        for (const post of state.posts) {
          const found = post.slots.find(s => s.id === payload.slotId)
          if (found) { slot = found; break }
        }
        if (!slot) throw new Error(`Slot not found: ${payload.slotId}`)
        return new AssignVolunteer().execute({ volunteer, slot, schedule: state.schedule, editionId: EDITION_ID })
      }

      case 'UnassignVolunteer': {
        if (!state.schedule) throw new Error('No schedule found')
        return new UnassignVolunteer().execute({ schedule: state.schedule, assignmentId: payload.assignmentId })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
}
```

- [ ] **Lancer les tests**

```bash
~/.bun/bin/bun run --bun node_modules/.bin/vitest run src/server/crew/CrewCommandHandler.test.js
```

Expected: 8 tests PASS

- [ ] **Commit**

```bash
git add src/server/crew/CrewCommandHandler.js src/server/crew/CrewCommandHandler.test.js
git commit -m "feat(server): add CrewCommandHandler"
```

---

## Task 5 : Wire crew dans CommandDispatcher

**Files:**
- Modify: `src/server/CommandDispatcher.js`

Le fichier actuel est :

```js
import { generateId } from '../../shared/generateId.js'
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
  // ...
}
```

- [ ] **Lire le fichier actuel**

```bash
cat src/server/CommandDispatcher.js
```

- [ ] **Ajouter les imports crew en tête de `src/server/CommandDispatcher.js`**

Après les imports existants (MioumCommandHandler, MioumProjection), ajouter :

```js
import { CrewCommandHandler } from './crew/CrewCommandHandler.js'
import { CrewProjection } from './crew/CrewProjection.js'
```

- [ ] **Modifier le constructeur pour ajouter crew**

Remplacer la section du constructeur :
```js
    const mioumProjection = new MioumProjection(this.#store)
    this.#projections = { mioum: mioumProjection }
    this.#handlers = { mioum: new MioumCommandHandler(mioumProjection) }
```

Par :
```js
    const mioumProjection = new MioumProjection(this.#store)
    const crewProjection = new CrewProjection(this.#store)
    this.#projections = {
      mioum: mioumProjection,
      crew: crewProjection,
    }
    this.#handlers = {
      mioum: new MioumCommandHandler(mioumProjection),
      crew: new CrewCommandHandler(crewProjection),
    }
```

- [ ] **Lancer tous les tests serveur**

```bash
~/.bun/bin/bun run --bun node_modules/.bin/vitest run src/server/
```

Expected: tous les tests PASS (mioum + crew)

- [ ] **Commit**

```bash
git add src/server/CommandDispatcher.js
git commit -m "feat(server): wire crew into CommandDispatcher"
```

---

## Task 6 : Migrer crew.js + banner offline + test d'intégration

**Files:**
- Modify: `src/crew/crew.js`
- Modify: `crew.html`
- Create: `src/server/crew/CrewIntegration.test.js`

### Step 1 : Ajouter le banner offline dans `crew.html`

Ajouter comme premier enfant de `<body>` :

```html
<div id="offline-banner" hidden style="position:fixed;top:0;left:0;right:0;background:#f59e0b;color:#fff;text-align:center;padding:8px;font-weight:bold;z-index:9999"></div>
```

### Step 2 : Réécrire `src/crew/crew.js`

Points clés :
- `planningView` et `statsView` utilisent `schedule.getConflicts()` et `schedule.getAssignmentsForVolunteer()` — il faut passer des objets domaine `Schedule`, pas des plain objects
- `volunteerList`, `postList`, `addSlotForm`, `assignForm` utilisent `v.name.value` et `p.name.value` — il faut passer des objets `Volunteer` et `Post` reconstruits
- Les proxy use cases des formulaires valident côté client et retournent le payload WS

```js
import { Volunteer } from './domain/model/Volunteer.js'
import { Post } from './domain/model/Post.js'
import { Schedule } from './domain/model/Schedule.js'
import { CreateVolunteer } from './application/usecases/CreateVolunteer.js'
import { UpdateVolunteerName } from './application/usecases/UpdateVolunteerName.js'
import { CreatePost } from './application/usecases/CreatePost.js'
import { UpdatePostName } from './application/usecases/UpdatePostName.js'
import { AddSlotToPost } from './application/usecases/AddSlotToPost.js'
import { UpdateSlotInPost } from './application/usecases/UpdateSlotInPost.js'
import { WsClient } from '../client/WsClient.js'
import './adapters/ui/CrewVolunteerForm.js'
import './adapters/ui/CrewVolunteerList.js'
import './adapters/ui/CrewEditVolunteerNameForm.js'
import './adapters/ui/CrewPostForm.js'
import './adapters/ui/CrewPostList.js'
import './adapters/ui/CrewAddSlotForm.js'
import './adapters/ui/CrewEditSlotForm.js'
import './adapters/ui/CrewEditPostNameForm.js'
import './adapters/ui/CrewAssignForm.js'
import './adapters/ui/CrewPlanningView.js'
import './adapters/ui/CrewStatsView.js'

const EDITION_ID = 'edition-2024'
const ws = new WsClient('ws://localhost:3000')

const volunteerForm = document.querySelector('crew-volunteer-form')
const volunteerList = document.querySelector('crew-volunteer-list')
const editVolunteerNameForm = document.querySelector('crew-edit-volunteer-name-form')
const postForm = document.querySelector('crew-post-form')
const postList = document.querySelector('crew-post-list')
const addSlotForm = document.querySelector('crew-add-slot-form')
const editSlotForm = document.querySelector('crew-edit-slot-form')
const editPostNameForm = document.querySelector('crew-edit-post-name-form')
const assignForm = document.querySelector('crew-assign-form')
const planningView = document.querySelector('crew-planning-view')
const statsView = document.querySelector('crew-stats-view')
const offlineBanner = document.getElementById('offline-banner')

// Proxy use cases — valident côté client, retournent le payload WS
volunteerForm.createVolunteerUseCase = {
  execute: ({ name }) => {
    new CreateVolunteer().execute({ name })
    return { name }
  },
}

editVolunteerNameForm.updateVolunteerNameUseCase = {
  execute: ({ volunteerId, name }) => {
    new UpdateVolunteerName().execute({ volunteer: { id: volunteerId, name: 'x' }, name })
    return { volunteerId, name }
  },
}

postForm.createPostUseCase = {
  execute: ({ name, minVolunteers }) => {
    new CreatePost().execute({ name, minVolunteers })
    return { name, minVolunteers }
  },
}

editPostNameForm.updatePostNameUseCase = {
  execute: ({ postId, name }) => {
    new UpdatePostName().execute({ post: { id: postId, name: 'x', minVolunteers: 1, slots: [] }, name })
    return { postId, name }
  },
}

addSlotForm.addSlotToPostUseCase = {
  execute: ({ postId, day, startTime, endTime }) => {
    new AddSlotToPost().execute({ post: { id: postId, name: 'x', minVolunteers: 1, slots: [] }, day, startTime, endTime })
    return { postId, day, startTime, endTime }
  },
}

editSlotForm.updateSlotInPostUseCase = {
  execute: ({ postId, slotId, day, startTime, endTime }) => {
    return { postId, slotId, day, startTime, endTime }
  },
}

assignForm.editionId = EDITION_ID
assignForm.assignVolunteerUseCase = {
  execute: ({ volunteerId, slotId }) => ({ volunteerId, slotId }),
}

ws.onState('crew', ({ volunteers, posts, schedule }) => {
  const domainVolunteers = volunteers.map(v => Volunteer.fromJSON(v))
  const domainPosts = posts.map(p => Post.fromJSON(p))
  const domainSchedule = schedule ? Schedule.fromJSON(schedule) : null

  volunteerList.refresh({ findAll: () => Promise.resolve(domainVolunteers) })
  postList.refresh({ findAll: () => Promise.resolve(domainPosts) })
  addSlotForm.posts = domainPosts
  assignForm.volunteers = domainVolunteers
  assignForm.posts = domainPosts

  planningView.refresh({
    scheduleRepo: { findByEdition: () => Promise.resolve(domainSchedule) },
    volunteerRepo: { findAll: () => Promise.resolve(domainVolunteers) },
    postRepo: { findAll: () => Promise.resolve(domainPosts) },
  }, EDITION_ID)

  statsView.refresh({
    scheduleRepo: { findByEdition: () => Promise.resolve(domainSchedule) },
    volunteerRepo: { findAll: () => Promise.resolve(domainVolunteers) },
  }, EDITION_ID)
})

ws.onConnectionChange(({ connected, queueLength }) => {
  offlineBanner.hidden = connected
  offlineBanner.textContent = `Hors ligne — ${queueLength} action(s) en attente`
})

const dispatchError = msg => document.dispatchEvent(new CustomEvent('crew-error', { detail: { message: msg } }))

document.addEventListener('volunteer-created', e =>
  ws.send('crew', 'CreateVolunteer', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('volunteer-name-updated', e =>
  ws.send('crew', 'UpdateVolunteerName', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('volunteer-edit-name-requested', e => editVolunteerNameForm.open(e.detail))

document.addEventListener('volunteer-delete-requested', e =>
  ws.send('crew', 'DeleteVolunteer', { volunteerId: e.detail.volunteerId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('post-created', e =>
  ws.send('crew', 'CreatePost', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('post-name-updated', e =>
  ws.send('crew', 'UpdatePostName', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('post-edit-name-requested', e => editPostNameForm.open(e.detail))

document.addEventListener('post-delete-requested', e =>
  ws.send('crew', 'DeletePost', { postId: e.detail.postId }).catch(err => dispatchError(err.message)))

document.addEventListener('slot-added', e =>
  ws.send('crew', 'AddSlotToPost', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('slot-updated', e =>
  ws.send('crew', 'UpdateSlotInPost', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('slot-edit-requested', e => editSlotForm.open(e.detail))

document.addEventListener('slot-delete-requested', e =>
  ws.send('crew', 'RemoveSlotFromPost', { postId: e.detail.postId, slotId: e.detail.slotId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('assign-slot-requested', e => assignForm.selectSlot(e.detail))

document.addEventListener('volunteer-assigned', e =>
  ws.send('crew', 'AssignVolunteer', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('assignment-delete-requested', e =>
  ws.send('crew', 'UnassignVolunteer', { assignmentId: e.detail.assignmentId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('crew-error', e => {
  const alert = document.getElementById('crew-alert')
  alert.textContent = e.detail.message
  alert.hidden = false
  setTimeout(() => { alert.hidden = true }, 4000)
})
```

### Step 3 : Créer `src/server/crew/CrewIntegration.test.js`

```js
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
    const postState = await new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'crew' && msg.data.posts.length > 0) resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-2', module: 'crew', action: 'CreatePost', payload: { name: 'Bar', minVolunteers: 1 } }))
    await postState

    const state1 = dispatcher.snapshots().find(s => s.module === 'crew').data
    const postId = state1.posts[0].id

    const slotState = await new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'crew' && msg.data.posts[0]?.slots?.length > 0) resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-3', module: 'crew', action: 'AddSlotToPost', payload: { postId, day: 'samedi', startTime: '10:00', endTime: '14:00' } }))
    await slotState

    const state2 = dispatcher.snapshots().find(s => s.module === 'crew').data
    const slotId = state2.posts[0].slots[0].id
    const volunteerId = state2.volunteers[0].id

    const assignState = await new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.type === 'state' && msg.module === 'crew' && msg.data.schedule?.assignments?.length > 0) resolve(msg.data)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-4', module: 'crew', action: 'AssignVolunteer', payload: { volunteerId, slotId } }))
    const finalState = await assignState

    expect(finalState.schedule.assignments).toHaveLength(1)
    expect(finalState.schedule.assignments[0].volunteerId).toBe(volunteerId)
  })

  it('validation error returns ok:false ack', async () => {
    const ack = await new Promise(resolve => {
      ws1.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data)
        if (msg.id === 'cmd-err') resolve(msg)
      })
    })
    ws1.send(JSON.stringify({ id: 'cmd-err', module: 'crew', action: 'CreateVolunteer', payload: { name: '' } }))
    await ack

    expect(ack.ok).toBe(false)
    expect(ack.error).toBeDefined()
  })
})
```

- [ ] **Lancer le test d'intégration**

```bash
~/.bun/bin/bun run --bun node_modules/.bin/vitest run src/server/crew/CrewIntegration.test.js
```

Expected: 4 tests PASS

- [ ] **Lancer tous les tests serveur**

```bash
~/.bun/bin/bun run --bun node_modules/.bin/vitest run src/server/
```

Expected: tous les tests PASS (mioum + crew)

- [ ] **Commit final**

```bash
git add src/crew/crew.js crew.html src/server/crew/CrewIntegration.test.js
git commit -m "feat(crew): migrate orchestrator to WsClient + integration test"
```

---

## Vérification finale

- [ ] Démarrer le serveur : `~/.bun/bin/bun run server` (depuis le dossier ludinator)
- [ ] Démarrer le frontend : `npm run dev`
- [ ] Ouvrir `http://localhost:5173/crew.html` dans deux onglets
- [ ] Créer un bénévole dans l'onglet 1 → vérifie qu'il apparaît dans l'onglet 2
- [ ] Créer un poste + ajouter un créneau + affecter un bénévole
- [ ] Vérifier que le planning s'affiche correctement avec les bénévoles affectés
- [ ] Couper le serveur → banner orange apparaît
- [ ] Redémarrer → queue se rejoue
