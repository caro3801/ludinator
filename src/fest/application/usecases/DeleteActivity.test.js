import { describe, it, expect } from 'vitest'
import { DeleteActivity } from './DeleteActivity.js'
import { Activity } from '../../domain/model/Activity.js'
import { InMemoryActivityRepository } from '../../adapters/storage/InMemoryActivityRepository.js'

describe('DeleteActivity', () => {
  it('removes the activity from the repository', async () => {
    const repo = new InMemoryActivityRepository()
    const a = Activity.create('Quiz')
    await repo.save(a)
    await new DeleteActivity(repo).execute({ activityId: a.id })
    expect(await repo.findById(a.id)).toBeNull()
  })

  it('throws when activity is not found', async () => {
    await expect(new DeleteActivity(new InMemoryActivityRepository()).execute({ activityId: 'nope' })).rejects.toThrow()
  })
})
