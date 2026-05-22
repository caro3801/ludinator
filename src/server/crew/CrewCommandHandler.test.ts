import { describe, it, expect, beforeEach } from 'vitest'
import { CrewCommandHandler } from './CrewCommandHandler'
import { CrewProjection } from './CrewProjection'
import { EventStore } from '../EventStore'

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
