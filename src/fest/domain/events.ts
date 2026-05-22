export class ActivityCreated {
  constructor({ activity, occurredAt = new Date().toISOString() }) {
    this.type = 'ActivityCreated'
    this.module = 'fest'
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class ActivityNameUpdated {
  constructor({ activity, occurredAt = new Date().toISOString() }) {
    this.type = 'ActivityNameUpdated'
    this.module = 'fest'
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class ActivityDeleted {
  constructor({ activityId, occurredAt = new Date().toISOString() }) {
    this.type = 'ActivityDeleted'
    this.module = 'fest'
    this.aggregateId = activityId
    this.payload = { activityId }
    this.occurredAt = occurredAt
  }
}

export class SlotAddedToActivity {
  constructor({ activity, occurredAt = new Date().toISOString() }) {
    this.type = 'SlotAddedToActivity'
    this.module = 'fest'
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class RegistrationAdded {
  constructor({ activity, occurredAt = new Date().toISOString() }) {
    this.type = 'RegistrationAdded'
    this.module = 'fest'
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class RegistrationUpdated {
  constructor({ activity, occurredAt = new Date().toISOString() }) {
    this.type = 'RegistrationUpdated'
    this.module = 'fest'
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class RegistrationCancelled {
  constructor({ activity, occurredAt = new Date().toISOString() }) {
    this.type = 'RegistrationCancelled'
    this.module = 'fest'
    this.aggregateId = activity.id
    this.payload = activity
    this.occurredAt = occurredAt
  }
}

export class SubCounterAdded {
  constructor({ entryLog, occurredAt = new Date().toISOString() }) {
    this.type = 'SubCounterAdded'
    this.module = 'fest'
    this.aggregateId = entryLog.id
    this.payload = entryLog
    this.occurredAt = occurredAt
  }
}

export class SubCounterRemoved {
  constructor({ entryLog, occurredAt = new Date().toISOString() }) {
    this.type = 'SubCounterRemoved'
    this.module = 'fest'
    this.aggregateId = entryLog.id
    this.payload = entryLog
    this.occurredAt = occurredAt
  }
}

export class EntriesRecorded {
  constructor({ entryLog, occurredAt = new Date().toISOString() }) {
    this.type = 'EntriesRecorded'
    this.module = 'fest'
    this.aggregateId = entryLog.id
    this.payload = entryLog
    this.occurredAt = occurredAt
  }
}

export class SubCounterBatchUpdated {
  constructor({ entryLog, occurredAt = new Date().toISOString() }) {
    this.type = 'SubCounterBatchUpdated'
    this.module = 'fest'
    this.aggregateId = entryLog.id
    this.payload = entryLog
    this.occurredAt = occurredAt
  }
}

export class SubCounterBatchDeleted {
  constructor({ entryLog, occurredAt = new Date().toISOString() }) {
    this.type = 'SubCounterBatchDeleted'
    this.module = 'fest'
    this.aggregateId = entryLog.id
    this.payload = entryLog
    this.occurredAt = occurredAt
  }
}
