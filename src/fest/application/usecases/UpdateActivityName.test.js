import { describe, it, expect } from 'vitest'
import { UpdateActivityName } from './UpdateActivityName.js'
import { Activity } from '../../domain/model/Activity.js'
import { InMemoryActivityRepository } from '../../adapters/storage/InMemoryActivityRepository.js'

describe('UpdateActivityName', () => {
  const seed = async (repo) => {
    const a = Activity.create('Escape Game')
    await repo.save(a)
    return a
  }

  it('renames the activity and persists it', async () => {
    const repo = new InMemoryActivityRepository()
    const a = await seed(repo)
    const updated = await new UpdateActivityName(repo).execute({ activityId: a.id, name: 'Super Escape' })
    expect(updated.name.value).toBe('Super Escape')
    expect((await repo.findById(a.id)).name.value).toBe('Super Escape')
  })

  it('throws when activity is not found', async () => {
    await expect(new UpdateActivityName(new InMemoryActivityRepository()).execute({ activityId: 'nope', name: 'X' })).rejects.toThrow()
  })

  it('rejects an empty name', async () => {
    const repo = new InMemoryActivityRepository()
    const a = await seed(repo)
    await expect(new UpdateActivityName(repo).execute({ activityId: a.id, name: '' })).rejects.toThrow()
  })
})
