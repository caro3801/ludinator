import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateSlotInPost } from './UpdateSlotInPost.js'
import { InMemoryPostRepository } from '../../adapters/storage/InMemoryPostRepository.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('UpdateSlotInPost', () => {
  let repo, useCase, post, slot

  beforeEach(async () => {
    repo = new InMemoryPostRepository()
    useCase = new UpdateSlotInPost(repo)

    post = Post.create('Accueil', 2)
    slot = post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    await repo.save(post)
  })

  it('updates the slot window and persists the post', async () => {
    const updated = await useCase.execute({
      postId: post.id,
      slotId: slot.id,
      day: 'sunday',
      startTime: '10:00',
      endTime: '14:00',
    })

    expect(updated.window.day).toBe('sunday')
    expect(updated.window.startTime).toBe('10:00')

    const saved = await repo.findById(post.id)
    expect(saved.slots[0].window.day).toBe('sunday')
  })

  it('throws when post is not found', async () => {
    await expect(useCase.execute({
      postId: 'unknown',
      slotId: slot.id,
      day: 'sunday',
      startTime: '10:00',
      endTime: '14:00',
    })).rejects.toThrow()
  })

  it('throws for an invalid time window', async () => {
    await expect(useCase.execute({
      postId: post.id,
      slotId: slot.id,
      day: 'saturday',
      startTime: '14:00',
      endTime: '09:00',
    })).rejects.toThrow()
  })
})
