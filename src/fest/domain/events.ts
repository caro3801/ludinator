import { ActivityId, EntryId } from '../../shared/types'

interface ActivityPayload {
  id: ActivityId
  name: string
  location: string | null
  slots: unknown[]
}

interface EntryLogPayload {
  id: EntryId
  editionId: string
  subCounters: unknown[]
}

export class ActivityCreated {
  readonly type = 'ActivityCreated'
  readonly module = 'fest'
  readonly aggregateId: ActivityId
  readonly payload: ActivityPayload
  readonly occurredAt: string

  constructor({ activity, occurredAt = new Date().toISOString() }: { activity: ActivityPayload; occurredAt?: string }) {
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class ActivityNameUpdated {
  readonly type = 'ActivityNameUpdated'
  readonly module = 'fest'
  readonly aggregateId: ActivityId
  readonly payload: ActivityPayload
  readonly occurredAt: string

  constructor({ activity, occurredAt = new Date().toISOString() }: { activity: ActivityPayload; occurredAt?: string }) {
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class ActivityDeleted {
  readonly type = 'ActivityDeleted'
  readonly module = 'fest'
  readonly aggregateId: ActivityId
  readonly payload: { activityId: ActivityId }
  readonly occurredAt: string

  constructor({ activityId, occurredAt = new Date().toISOString() }: { activityId: ActivityId; occurredAt?: string }) {
    this.aggregateId = activityId
    this.payload = { activityId }
    this.occurredAt = occurredAt
  }
}

export class SlotAddedToActivity {
  readonly type = 'SlotAddedToActivity'
  readonly module = 'fest'
  readonly aggregateId: ActivityId
  readonly payload: ActivityPayload
  readonly occurredAt: string

  constructor({ activity, occurredAt = new Date().toISOString() }: { activity: ActivityPayload; occurredAt?: string }) {
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class RegistrationAdded {
  readonly type = 'RegistrationAdded'
  readonly module = 'fest'
  readonly aggregateId: ActivityId
  readonly payload: ActivityPayload
  readonly occurredAt: string

  constructor({ activity, occurredAt = new Date().toISOString() }: { activity: ActivityPayload; occurredAt?: string }) {
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class RegistrationUpdated {
  readonly type = 'RegistrationUpdated'
  readonly module = 'fest'
  readonly aggregateId: ActivityId
  readonly payload: ActivityPayload
  readonly occurredAt: string

  constructor({ activity, occurredAt = new Date().toISOString() }: { activity: ActivityPayload; occurredAt?: string }) {
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class RegistrationCancelled {
  readonly type = 'RegistrationCancelled'
  readonly module = 'fest'
  readonly aggregateId: ActivityId
  readonly payload: ActivityPayload
  readonly occurredAt: string

  constructor({ activity, occurredAt = new Date().toISOString() }: { activity: ActivityPayload; occurredAt?: string }) {
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class SubCounterAdded {
  readonly type = 'SubCounterAdded'
  readonly module = 'fest'
  readonly aggregateId: EntryId
  readonly payload: EntryLogPayload
  readonly occurredAt: string

  constructor({ entryLog, occurredAt = new Date().toISOString() }: { entryLog: EntryLogPayload; occurredAt?: string }) {
    this.aggregateId = entryLog.id
    this.payload = entryLog
    this.occurredAt = occurredAt
  }
}

export class SubCounterRemoved {
  readonly type = 'SubCounterRemoved'
  readonly module = 'fest'
  readonly aggregateId: EntryId
  readonly payload: EntryLogPayload
  readonly occurredAt: string

  constructor({ entryLog, occurredAt = new Date().toISOString() }: { entryLog: EntryLogPayload; occurredAt?: string }) {
    this.aggregateId = entryLog.id
    this.payload = entryLog
    this.occurredAt = occurredAt
  }
}

export class EntriesRecorded {
  readonly type = 'EntriesRecorded'
  readonly module = 'fest'
  readonly aggregateId: EntryId
  readonly payload: EntryLogPayload
  readonly occurredAt: string

  constructor({ entryLog, occurredAt = new Date().toISOString() }: { entryLog: EntryLogPayload; occurredAt?: string }) {
    this.aggregateId = entryLog.id
    this.payload = entryLog
    this.occurredAt = occurredAt
  }
}

export class SubCounterBatchUpdated {
  readonly type = 'SubCounterBatchUpdated'
  readonly module = 'fest'
  readonly aggregateId: EntryId
  readonly payload: EntryLogPayload
  readonly occurredAt: string

  constructor({ entryLog, occurredAt = new Date().toISOString() }: { entryLog: EntryLogPayload; occurredAt?: string }) {
    this.aggregateId = entryLog.id
    this.payload = entryLog
    this.occurredAt = occurredAt
  }
}

export class SubCounterBatchDeleted {
  readonly type = 'SubCounterBatchDeleted'
  readonly module = 'fest'
  readonly aggregateId: EntryId
  readonly payload: EntryLogPayload
  readonly occurredAt: string

  constructor({ entryLog, occurredAt = new Date().toISOString() }: { entryLog: EntryLogPayload; occurredAt?: string }) {
    this.aggregateId = entryLog.id
    this.payload = entryLog
    this.occurredAt = occurredAt
  }
}
