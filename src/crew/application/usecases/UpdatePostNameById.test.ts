import { describe, it, expect, vi } from 'vitest'
import { UpdatePostNameById } from './UpdatePostNameById'
import { Post } from '../../domain/model/Post'
import type { PostRepository } from '../../ports/PostRepository'

describe('UpdatePostNameById', () => {
  it('updates post name when post exists', async () => {
    const post = Post.fromJSON({ id: 'p1', name: 'Bar', minVolunteers: 2, slots: [] })
    const mockRepo: PostRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(post),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const useCase = new UpdatePostNameById(mockRepo)

    const result = await useCase.execute({ postId: 'p1', name: 'Restaurant' })

    expect(result.type).toBe('PostNameUpdated')
    expect(result.payload.name).toBe('Restaurant')
    expect(mockRepo.save).toHaveBeenCalledWith(post)
  })

  it('throws when post is not found', async () => {
    const mockRepo: PostRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const useCase = new UpdatePostNameById(mockRepo)

    await expect(useCase.execute({ postId: 'unknown', name: 'Restaurant' }))
      .rejects.toThrow('Post not found')
  })

  it('saves the updated post', async () => {
    const post = Post.fromJSON({ id: 'p1', name: 'Bar', minVolunteers: 2, slots: [] })
    const mockRepo: PostRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(post),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const useCase = new UpdatePostNameById(mockRepo)

    await useCase.execute({ postId: 'p1', name: 'Restaurant' })

    expect(mockRepo.save).toHaveBeenCalledWith(post)
    expect(post.name.value).toBe('Restaurant')
  })
})
