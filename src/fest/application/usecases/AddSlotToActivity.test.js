import { describe, it, expect } from 'vitest'
import { AddSlotToActivity } from './AddSlotToActivity.js'
import { Activity } from '../../domain/model/Activity.js'
import { InMemoryActivityRepository } from '../../adapters/storage/InMemoryActivityRepository.js'

describe('AddSlotToActivity', () => {
  const seed = async (repo) => {
    const a = Activity.create('Quiz')
    await repo.save(a)
    return a
  }

  it('adds a slot and persists the activity', async () => {
    const repo = new InMemoryActivityRepository()
    const a = await seed(repo)
    const slot = await new AddSlotToActivity(repo).execute({
      activityId: a.id,
      day: 'saturday',
      startTime: '10:00',
      endTime: '12:00',
    })
    expect(slot.id).toBeDefined()
    expect((await repo.findById(a.id)).slots).toHaveLength(1)
  })

  it('stores optional min and max participants', async () => {
    const repo = new InMemoryActivityRepository()
    const a = await seed(repo)
    const slot = await new AddSlotToActivity(repo).execute({
      activityId: a.id,
      day: 'saturday',
      startTime: '10:00',
      endTime: '12:00',
      min: 5,
      max: 30,
    })
    expect(slot.minParticipants).toBe(5)
    expect(slot.maxParticipants).toBe(30)
  })

  it('throws when activity is not found', async () => {
    await expect(new AddSlotToActivity(new InMemoryActivityRepository()).execute({
      activityId: 'nope',
      day: 'saturday',
      startTime: '10:00',
      endTime: '12:00',
    })).rejects.toThrow()
  })
})
