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
