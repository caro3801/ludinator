import { describe, it, expect } from 'vitest'
import { RegisterToActivity } from './RegisterToActivity.js'
import { Activity } from '../../domain/model/Activity.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'
import { InMemoryActivityRepository } from '../../adapters/storage/InMemoryActivityRepository.js'

describe('RegisterToActivity', () => {
  const seed = async (repo) => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    await repo.save(a)
    return { activity: a, slot: a.slots[0] }
  }

  it('adds a registration to the slot', async () => {
    const repo = new InMemoryActivityRepository()
    const { slot } = await seed(repo)
    const reg = await new RegisterToActivity(repo).execute({ activityId: slot.activityId, slotId: slot.id, personName: 'Alice' })
    expect(reg.personName).toBe('Alice')
    expect((await repo.findById(slot.activityId)).slots[0].registrations).toHaveLength(1)
  })

  it('throws when activity is not found', async () => {
    await expect(new RegisterToActivity(new InMemoryActivityRepository()).execute({ activityId: 'nope', slotId: 'x', personName: 'Alice' })).rejects.toThrow()
  })

  it('throws when slot is not found', async () => {
    const repo = new InMemoryActivityRepository()
    const { activity } = await seed(repo)
    await expect(new RegisterToActivity(repo).execute({ activityId: activity.id, slotId: 'bad', personName: 'Alice' })).rejects.toThrow()
  })

  it('throws when name is empty', async () => {
    const repo = new InMemoryActivityRepository()
    const { slot } = await seed(repo)
    await expect(new RegisterToActivity(repo).execute({ activityId: slot.activityId, slotId: slot.id, personName: '' })).rejects.toThrow()
  })
})
