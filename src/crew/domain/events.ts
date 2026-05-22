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
