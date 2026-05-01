// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageScheduleRepository } from './LocalStorageScheduleRepository.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('LocalStorageScheduleRepository', () => {
  let repo

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageScheduleRepository()
  })

  it('returns null when no schedule exists for an edition', async () => {
    expect(await repo.findByEdition('edition-2024')).toBeNull()
  })

  it('saves and retrieves a schedule by edition', async () => {
    const schedule = Schedule.create('edition-2024')
    await repo.save(schedule)

    const found = await repo.findByEdition('edition-2024')
    expect(found.editionId).toBe('edition-2024')
  })

  it('persists assignments across instances', async () => {
    const schedule = Schedule.create('edition-2024')
    const volunteer = Volunteer.create('Alice')
    const post = Post.create('Accueil', 2)
    const slot = post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(volunteer, slot)
    await repo.save(schedule)

    const repo2 = new LocalStorageScheduleRepository()
    const found = await repo2.findByEdition('edition-2024')
    expect(found.getAssignmentsForVolunteer(volunteer.id)).toHaveLength(1)
  })
})
