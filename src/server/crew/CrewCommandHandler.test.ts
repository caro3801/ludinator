import { describe, it, expect, beforeEach } from 'vitest'
import { CrewCommandHandler } from './CrewCommandHandler'
import { CrewProjection } from './CrewProjection'
import { EventStore } from '../EventStore'

describe('CrewCommandHandler', () => {
  let store: EventStore
  let projection: CrewProjection
  let handler: CrewCommandHandler

  beforeEach(() => {
    store = new EventStore(':memory:')
    projection = new CrewProjection(store)
    handler = new CrewCommandHandler(projection)
  })

  it('CreateVolunteer returns VolunteerCreated', async () => {
    const event = await handler.execute('CreateVolunteer', { name: 'Alice' })
    expect(event.type).toBe('VolunteerCreated')
    expect((event.payload as { name: string }).name).toBe('Alice')
  })

  it('UpdateVolunteerName throws when volunteer not found', async () => {
    await expect(handler.execute('UpdateVolunteerName', { volunteerId: 'x', name: 'Bob' }))
      .rejects.toThrow('Volunteer not found')
  })

  it('CreatePost returns PostCreated', async () => {
    const event = await handler.execute('CreatePost', { name: 'Accueil', minVolunteers: 2 })
    expect(event.type).toBe('PostCreated')
    expect((event.payload as { name: string }).name).toBe('Accueil')
  })

  it('AddSlotToPost throws when post not found', async () => {
    await expect(handler.execute('AddSlotToPost', { postId: 'x', day: 'samedi', startTime: '09:00', endTime: '12:00' }))
      .rejects.toThrow('Post not found')
  })

  it('AssignVolunteer throws when volunteer not found', async () => {
    await expect(handler.execute('AssignVolunteer', { volunteerId: 'x', slotId: 'y' }))
      .rejects.toThrow('Volunteer not found')
  })

  it('AssignVolunteer throws when slot not found', async () => {
    const created = await handler.execute('CreateVolunteer', { name: 'Alice' })
    store.append({ ...created, id: '1', occurredAt: new Date().toISOString() })
    const volunteerId = projection.rebuild().volunteers[0].id
    await expect(handler.execute('AssignVolunteer', { volunteerId, slotId: 'unknown' }))
      .rejects.toThrow('Slot not found')
  })

  it('full flow: create post, add slot, create volunteer, assign', async () => {
    const postEvent = await handler.execute('CreatePost', { name: 'Accueil', minVolunteers: 2 })
    store.append({ ...postEvent, id: '1', occurredAt: new Date().toISOString() })

    const state1 = projection.rebuild()
    const slotEvent = await handler.execute('AddSlotToPost', {
      postId: state1.posts[0].id,
      day: 'samedi', startTime: '09:00', endTime: '12:00',
    })
    store.append({ ...slotEvent, id: '2', occurredAt: new Date().toISOString() })

    const volEvent = await handler.execute('CreateVolunteer', { name: 'Alice' })
    store.append({ ...volEvent, id: '3', occurredAt: new Date().toISOString() })

    const state = projection.rebuild()
    const volunteerId = state.volunteers[0].id
    const slotId = state.posts[0].slots[0].id

    const assignEvent = await handler.execute('AssignVolunteer', { volunteerId, slotId })
    expect(assignEvent.type).toBe('VolunteerAssigned')
    expect((assignEvent.payload as { assignments: unknown[] }).assignments).toHaveLength(1)
  })

  it('CopySlotsToPost throws when source post not found', async () => {
    const targetPost = await handler.execute('CreatePost', { name: 'Bar', minVolunteers: 1 })
    store.append({ ...targetPost, id: '1', occurredAt: new Date().toISOString() })
    
    await expect(handler.execute('CopySlotsToPost', { sourcePostId: 'x', targetPostId: '1' }))
      .rejects.toThrow('Source post not found')
  })

  it('CopySlotsToPost throws when target post not found', async () => {
    const sourcePost = await handler.execute('CreatePost', { name: 'Foo', minVolunteers: 1 })
    store.append(sourcePost)
    
    const sourcePostId = sourcePost.payload.id
    await expect(handler.execute('CopySlotsToPost', { sourcePostId, targetPostId: 'x' }))
      .rejects.toThrow('Target post not found')
  })

  it('CopySlotsToPost copies slots from source to target', async () => {
    const sourcePost = await handler.execute('CreatePost', { name: 'Foo', minVolunteers: 1 })
    store.append({ ...sourcePost, id: '1', occurredAt: new Date().toISOString() })
    
    const state1 = projection.rebuild()
    const slotEvent = await handler.execute('AddSlotToPost', {
      postId: state1.posts[0].id,
      day: 'samedi', startTime: '09:00', endTime: '12:00',
    })
    store.append({ ...slotEvent, id: '2', occurredAt: new Date().toISOString() })
    
    const targetPost = await handler.execute('CreatePost', { name: 'Bar', minVolunteers: 1 })
    store.append({ ...targetPost, id: '3', occurredAt: new Date().toISOString() })
    
    const state = projection.rebuild()
    const copyEvent = await handler.execute('CopySlotsToPost', {
      sourcePostId: state.posts[0].id,
      targetPostId: state.posts[1].id
    })
    
    expect(copyEvent.type).toBe('SlotsCopiedToPost')
    expect((copyEvent.payload as { copiedSlotCount: number }).copiedSlotCount).toBe(1)
  })

  it('throws on unknown action', () => {
    expect(() => handler.execute('UnknownAction', {})).toThrow('Unknown action')
  })
})
