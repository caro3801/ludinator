import { describe, it, expect } from 'vitest'
import { CreateActivity } from './CreateActivity.js'
import { InMemoryActivityRepository } from '../../adapters/storage/InMemoryActivityRepository.js'

describe('CreateActivity', () => {
  it('creates and persists an activity', async () => {
    const repo = new InMemoryActivityRepository()
    const useCase = new CreateActivity(repo)
    const activity = await useCase.execute({ name: 'Escape Game' })
    expect(activity.name.value).toBe('Escape Game')
    expect(await repo.findById(activity.id)).not.toBeNull()
  })

  it('stores an optional location', async () => {
    const repo = new InMemoryActivityRepository()
    const activity = await new CreateActivity(repo).execute({ name: 'Quiz', location: 'Salle B' })
    expect(activity.location).toBe('Salle B')
  })

  it('rejects an invalid name', async () => {
    await expect(new CreateActivity(new InMemoryActivityRepository()).execute({ name: '' })).rejects.toThrow()
  })
})
