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
