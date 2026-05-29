import { VolunteerId, PostId, ScheduleId, SlotId, EditionId } from '../../shared/types'

interface VolunteerJSON {
  id: VolunteerId
  name: string
}

interface PostJSON {
  id: PostId
  name: string
  minVolunteers: number
  slots: { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } }[]
}

interface ScheduleJSON {
  id: ScheduleId
  editionId: EditionId
  assignments: unknown[]
}

export class VolunteerCreated {
  readonly type = 'VolunteerCreated'
  readonly module = 'crew'
  readonly aggregateId: VolunteerId
  readonly payload: VolunteerJSON
  readonly occurredAt: string

  constructor({ volunteer, occurredAt = new Date().toISOString() }: { volunteer: VolunteerJSON; occurredAt?: string }) {
    this.aggregateId = volunteer.id
    this.payload = volunteer
    this.occurredAt = occurredAt
  }
}

export class VolunteerNameUpdated {
  readonly type = 'VolunteerNameUpdated'
  readonly module = 'crew'
  readonly aggregateId: VolunteerId
  readonly payload: VolunteerJSON
  readonly occurredAt: string

  constructor({ volunteer, occurredAt = new Date().toISOString() }: { volunteer: VolunteerJSON; occurredAt?: string }) {
    this.aggregateId = volunteer.id
    this.payload = volunteer
    this.occurredAt = occurredAt
  }
}

export class VolunteerDeleted {
  readonly type = 'VolunteerDeleted'
  readonly module = 'crew'
  readonly aggregateId: VolunteerId
  readonly payload: { volunteerId: VolunteerId }
  readonly occurredAt: string

  constructor({ volunteerId, occurredAt = new Date().toISOString() }: { volunteerId: VolunteerId; occurredAt?: string }) {
    this.aggregateId = volunteerId
    this.payload = { volunteerId }
    this.occurredAt = occurredAt
  }
}

export class PostCreated {
  readonly type = 'PostCreated'
  readonly module = 'crew'
  readonly aggregateId: PostId
  readonly payload: PostJSON
  readonly occurredAt: string

  constructor({ post, occurredAt = new Date().toISOString() }: { post: PostJSON; occurredAt?: string }) {
    this.aggregateId = post.id
    this.payload = post
    this.occurredAt = occurredAt
  }
}

export class PostNameUpdated {
  readonly type = 'PostNameUpdated'
  readonly module = 'crew'
  readonly aggregateId: PostId
  readonly payload: PostJSON
  readonly occurredAt: string

  constructor({ post, occurredAt = new Date().toISOString() }: { post: PostJSON; occurredAt?: string }) {
    this.aggregateId = post.id
    this.payload = post
    this.occurredAt = occurredAt
  }
}

export class PostDeleted {
  readonly type = 'PostDeleted'
  readonly module = 'crew'
  readonly aggregateId: PostId
  readonly payload: { postId: PostId }
  readonly occurredAt: string

  constructor({ postId, occurredAt = new Date().toISOString() }: { postId: PostId; occurredAt?: string }) {
    this.aggregateId = postId
    this.payload = { postId }
    this.occurredAt = occurredAt
  }
}

export class SlotAddedToPost {
  readonly type = 'SlotAddedToPost'
  readonly module = 'crew'
  readonly aggregateId: PostId
  readonly payload: PostJSON
  readonly occurredAt: string

  constructor({ post, occurredAt = new Date().toISOString() }: { post: PostJSON; occurredAt?: string }) {
    this.aggregateId = post.id
    this.payload = post
    this.occurredAt = occurredAt
  }
}

export class SlotRemovedFromPost {
  readonly type = 'SlotRemovedFromPost'
  readonly module = 'crew'
  readonly aggregateId: PostId
  readonly payload: { post: PostJSON; slotId: SlotId }
  readonly occurredAt: string

  constructor({ post, slotId, occurredAt = new Date().toISOString() }: { post: PostJSON; slotId: SlotId; occurredAt?: string }) {
    this.aggregateId = post.id
    this.payload = { post, slotId }
    this.occurredAt = occurredAt
  }
}

export class SlotUpdatedInPost {
  readonly type = 'SlotUpdatedInPost'
  readonly module = 'crew'
  readonly aggregateId: PostId
  readonly payload: PostJSON
  readonly occurredAt: string

  constructor({ post, occurredAt = new Date().toISOString() }: { post: PostJSON; occurredAt?: string }) {
    this.aggregateId = post.id
    this.payload = post
    this.occurredAt = occurredAt
  }
}

export class VolunteerAssigned {
  readonly type = 'VolunteerAssigned'
  readonly module = 'crew'
  readonly aggregateId: ScheduleId
  readonly payload: ScheduleJSON
  readonly occurredAt: string

  constructor({ schedule, occurredAt = new Date().toISOString() }: { schedule: ScheduleJSON; occurredAt?: string }) {
    this.aggregateId = schedule.id
    this.payload = schedule
    this.occurredAt = occurredAt
  }
}

export class VolunteerUnassigned {
  readonly type = 'VolunteerUnassigned'
  readonly module = 'crew'
  readonly aggregateId: ScheduleId
  readonly payload: ScheduleJSON
  readonly occurredAt: string

  constructor({ schedule, occurredAt = new Date().toISOString() }: { schedule: ScheduleJSON; occurredAt?: string }) {
    this.aggregateId = schedule.id
    this.payload = schedule
    this.occurredAt = occurredAt
  }
}

export class SlotsCopiedToPost {
  readonly type = 'SlotsCopiedToPost'
  readonly module = 'crew'
  readonly aggregateId: PostId
  readonly payload: { sourcePost: PostJSON; targetPost: PostJSON; copiedSlotCount: number }
  readonly occurredAt: string

  constructor({ sourcePost, targetPost, copiedSlotCount, occurredAt = new Date().toISOString() }: { sourcePost: PostJSON; targetPost: PostJSON; copiedSlotCount: number; occurredAt?: string }) {
    this.aggregateId = targetPost.id
    this.payload = { sourcePost, targetPost, copiedSlotCount }
    this.occurredAt = occurredAt
  }
}
