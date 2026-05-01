import { describe, it, expect, beforeEach } from 'vitest'
import { UpdatePostName } from './UpdatePostName.js'
import { InMemoryPostRepository } from '../../adapters/storage/InMemoryPostRepository.js'
import { Post } from '../../domain/model/Post.js'

describe('UpdatePostName', () => {
  let repo, useCase, post

  beforeEach(async () => {
    repo = new InMemoryPostRepository()
    useCase = new UpdatePostName(repo)
    post = Post.create('Accueil', 2)
    await repo.save(post)
  })

  it('updates the post name and persists it', async () => {
    const updated = await useCase.execute({ postId: post.id, name: 'Entrée' })
    expect(updated.name.value).toBe('Entrée')

    const saved = await repo.findById(post.id)
    expect(saved.name.value).toBe('Entrée')
  })

  it('throws when post is not found', async () => {
    await expect(useCase.execute({ postId: 'unknown', name: 'Entrée' })).rejects.toThrow()
  })

  it('rejects an empty name', async () => {
    await expect(useCase.execute({ postId: post.id, name: '' })).rejects.toThrow()
  })
})
