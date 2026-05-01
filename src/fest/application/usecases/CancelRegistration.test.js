import { describe, it, expect } from 'vitest'
import { CancelRegistration } from './CancelRegistration.js'
import { Activity } from '../../domain/model/Activity.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'
import { InMemoryActivityRepository } from '../../adapters/storage/InMemoryActivityRepository.js'

describe('CancelRegistration', () => {
  const seed = async (repo) => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    const slot = a.slots[0]
    const reg = slot.addRegistration('Alice')
    await repo.save(a)
    return { activity: a, slot, reg }
  }

  it('removes the registration', async () => {
    const repo = new InMemoryActivityRepository()
    const { activity, slot, reg } = await seed(repo)
    await new CancelRegistration(repo).execute({ activityId: activity.id, slotId: slot.id, registrationId: reg.id })
    expect((await repo.findById(activity.id)).slots[0].registrations).toHaveLength(0)
  })

  it('throws when activity is not found', async () => {
    await expect(new CancelRegistration(new InMemoryActivityRepository()).execute({ activityId: 'nope', slotId: 'x', registrationId: 'y' })).rejects.toThrow()
  })
})
