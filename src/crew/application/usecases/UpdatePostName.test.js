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
