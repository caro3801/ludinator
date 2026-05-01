import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteVolunteer } from './DeleteVolunteer.js'
import { InMemoryVolunteerRepository } from '../../adapters/storage/InMemoryVolunteerRepository.js'
import { InMemoryScheduleRepository } from '../../adapters/storage/InMemoryScheduleRepository.js'
import { InMemoryPostRepository } from '../../adapters/storage/InMemoryPostRepository.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('DeleteVolunteer', () => {
  let volunteerRepo, scheduleRepo, useCase, alice, slot, schedule

  beforeEach(async () => {
    volunteerRepo = new InMemoryVolunteerRepository()
    scheduleRepo = new InMemoryScheduleRepository()
    useCase = new DeleteVolunteer(volunteerRepo, scheduleRepo)

    alice = Volunteer.create('Alice')
    await volunteerRepo.save(alice)

    const post = Post.create('Accueil', 2)
    slot = post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule = Schedule.create('edition-2024')
    schedule.assign(alice, slot)
    await scheduleRepo.save(schedule)
  })

  it('removes the volunteer from the repository', async () => {
    await useCase.execute({ volunteerId: alice.id, editionId: 'edition-2024' })
    expect(await volunteerRepo.findById(alice.id)).toBeNull()
  })

  it('removes all assignments of the volunteer from the schedule', async () => {
    await useCase.execute({ volunteerId: alice.id, editionId: 'edition-2024' })
    const saved = await scheduleRepo.findByEdition('edition-2024')
    expect(saved.getAssignmentsForVolunteer(alice.id)).toHaveLength(0)
  })

  it('works when no schedule exists for the edition', async () => {
    await expect(
      useCase.execute({ volunteerId: alice.id, editionId: 'unknown' })
    ).resolves.not.toThrow()
  })

  it('throws when volunteer is not found', async () => {
    await expect(
      useCase.execute({ volunteerId: 'unknown', editionId: 'edition-2024' })
    ).rejects.toThrow()
  })
})
