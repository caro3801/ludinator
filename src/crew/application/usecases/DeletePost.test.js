import { describe, it, expect } from 'vitest'
import { DeletePost } from './DeletePost.js'
import { PostDeleted } from '../../domain/events.js'

describe('DeletePost', () => {
  it('emits PostDeleted with correct postId', () => {
    const event = new DeletePost().execute({ postId: 'p-1' })
    expect(event).toBeInstanceOf(PostDeleted)
    expect(event.payload.postId).toBe('p-1')
  })
})
