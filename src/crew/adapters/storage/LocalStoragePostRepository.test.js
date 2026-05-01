// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStoragePostRepository } from './LocalStoragePostRepository.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('LocalStoragePostRepository', () => {
  let repo

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStoragePostRepository()
  })

  it('saves and retrieves a post by id', async () => {
    const post = Post.create('Accueil', 2)
    await repo.save(post)

    const found = await repo.findById(post.id)
    expect(found.id).toBe(post.id)
    expect(found.name.value).toBe('Accueil')
    expect(found.minVolunteers).toBe(2)
  })

  it('persists slots alongside the post', async () => {
    const post = Post.create('Bar', 1)
    post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    await repo.save(post)

    const found = await repo.findById(post.id)
    expect(found.slots).toHaveLength(1)
    expect(found.slots[0].window.startTime).toBe('09:00')
  })

  it('returns null when post is not found', async () => {
    expect(await repo.findById('unknown')).toBeNull()
  })

  it('returns all saved posts', async () => {
    await repo.save(Post.create('Accueil', 2))
    await repo.save(Post.create('Bar', 1))
    expect(await repo.findAll()).toHaveLength(2)
  })

  it('finds a slot by id across all posts', async () => {
    const post = Post.create('Accueil', 2)
    const slot = post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    await repo.save(post)

    const found = await repo.findSlotById(slot.id)
    expect(found.id).toBe(slot.id)
  })

  it('returns null when slot is not found', async () => {
    expect(await repo.findSlotById('unknown')).toBeNull()
  })
})
