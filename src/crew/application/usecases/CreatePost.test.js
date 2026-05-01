import { describe, it, expect, beforeEach } from 'vitest'
import { CreatePost } from './CreatePost.js'
import { InMemoryPostRepository } from '../../adapters/storage/InMemoryPostRepository.js'

describe('CreatePost', () => {
  let repo, useCase

  beforeEach(() => {
    repo = new InMemoryPostRepository()
    useCase = new CreatePost(repo)
  })

  it('creates and persists a post', async () => {
    const post = await useCase.execute({ name: 'Accueil', minVolunteers: 2 })
    expect(post.name.value).toBe('Accueil')
    expect(post.minVolunteers).toBe(2)
    expect(await repo.findById(post.id)).toBe(post)
  })

  it('rejects an empty name', async () => {
    await expect(useCase.execute({ name: '', minVolunteers: 1 })).rejects.toThrow()
  })

  it('rejects zero minVolunteers', async () => {
    await expect(useCase.execute({ name: 'Bar', minVolunteers: 0 })).rejects.toThrow()
  })
})
