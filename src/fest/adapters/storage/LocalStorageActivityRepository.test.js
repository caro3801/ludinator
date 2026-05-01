// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageActivityRepository } from './LocalStorageActivityRepository.js'
import { Activity } from '../../domain/model/Activity.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('LocalStorageActivityRepository', () => {
  beforeEach(() => localStorage.clear())

  it('saves and retrieves an activity by id', async () => {
    const repo = new LocalStorageActivityRepository()
    const a = Activity.create('Escape Game', 'Salle A')
    await repo.save(a)
    const found = await repo.findById(a.id)
    expect(found.name.value).toBe('Escape Game')
    expect(found.location).toBe('Salle A')
  })

  it('persists slots alongside the activity', async () => {
    const repo = new LocalStorageActivityRepository()
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'), { min: 5, max: 20 })
    await repo.save(a)
    const found = await repo.findById(a.id)
    expect(found.slots).toHaveLength(1)
    expect(found.slots[0].minParticipants).toBe(5)
    expect(found.slots[0].maxParticipants).toBe(20)
  })

  it('persists registrations', async () => {
    const repo = new LocalStorageActivityRepository()
    const a = Activity.create('Quiz')
    const slot = a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    slot.addRegistration('Alice')
    slot.addRegistration('Bob')
    await repo.save(a)
    const found = await repo.findById(a.id)
    expect(found.slots[0].registrations).toHaveLength(2)
    expect(found.slots[0].registrations[0].personName).toBe('Alice')
  })

  it('returns null when activity is not found', async () => {
    expect(await new LocalStorageActivityRepository().findById('nope')).toBeNull()
  })

  it('returns all saved activities', async () => {
    const repo = new LocalStorageActivityRepository()
    await repo.save(Activity.create('Quiz'))
    await repo.save(Activity.create('Escape Game'))
    expect(await repo.findAll()).toHaveLength(2)
  })

  it('deletes an activity', async () => {
    const repo = new LocalStorageActivityRepository()
    const a = Activity.create('Quiz')
    await repo.save(a)
    await repo.delete(a.id)
    expect(await repo.findById(a.id)).toBeNull()
  })

  it('persists across repository instances', async () => {
    const a = Activity.create('Quiz')
    await new LocalStorageActivityRepository().save(a)
    expect(await new LocalStorageActivityRepository().findById(a.id)).not.toBeNull()
  })
})
