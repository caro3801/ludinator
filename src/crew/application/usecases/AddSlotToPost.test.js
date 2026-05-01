import { describe, it, expect, beforeEach } from 'vitest'
import { AddSlotToPost } from './AddSlotToPost.js'
import { InMemoryPostRepository } from '../../adapters/storage/InMemoryPostRepository.js'
import { Post } from '../../domain/model/Post.js'

describe('AddSlotToPost', () => {
  let repo, useCase, post

  beforeEach(async () => {
    repo = new InMemoryPostRepository()
    useCase = new AddSlotToPost(repo)
    post = Post.create('Accueil', 2)
    await repo.save(post)
  })

  it('adds a slot to an existing post and persists it', async () => {
    const slot = await useCase.execute({
      postId: post.id,
      day: 'saturday',
      startTime: '09:00',
      endTime: '12:00',
    })

    expect(slot.id).toBeDefined()
    expect(slot.window.day).toBe('saturday')

    const saved = await repo.findById(post.id)
    expect(saved.slots).toHaveLength(1)
    expect(saved.slots[0].id).toBe(slot.id)
  })

  it('throws when the post does not exist', async () => {
    await expect(useCase.execute({
      postId: 'unknown',
      day: 'saturday',
      startTime: '09:00',
      endTime: '12:00',
    })).rejects.toThrow()
  })

  it('rejects an invalid time window', async () => {
    await expect(useCase.execute({
      postId: post.id,
      day: 'saturday',
      startTime: '12:00',
      endTime: '09:00',
    })).rejects.toThrow()
  })
})
