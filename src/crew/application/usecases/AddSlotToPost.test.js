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
