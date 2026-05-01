import { describe, it, expect, beforeEach } from 'vitest'
import { UnassignVolunteer } from './UnassignVolunteer.js'
import { InMemoryScheduleRepository } from '../../adapters/storage/InMemoryScheduleRepository.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('UnassignVolunteer', () => {
  let scheduleRepo, useCase, alice, slot, schedule, assignment

  beforeEach(async () => {
    scheduleRepo = new InMemoryScheduleRepository()
    useCase = new UnassignVolunteer(scheduleRepo)

    alice = Volunteer.create('Alice')
    const post = Post.create('Accueil', 2)
    slot = post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))

    schedule = Schedule.create('edition-2024')
    assignment = schedule.assign(alice, slot)
    await scheduleRepo.save(schedule)
  })

  it('removes the assignment from the schedule', async () => {
    await useCase.execute({ assignmentId: assignment.id, editionId: 'edition-2024' })

    const saved = await scheduleRepo.findByEdition('edition-2024')
    expect(saved.getAssignmentsForVolunteer(alice.id)).toHaveLength(0)
  })

  it('does not affect other assignments', async () => {
    const bob = Volunteer.create('Bob')
    const bobAssignment = schedule.assign(bob, slot)
    await scheduleRepo.save(schedule)

    await useCase.execute({ assignmentId: assignment.id, editionId: 'edition-2024' })

    const saved = await scheduleRepo.findByEdition('edition-2024')
    expect(saved.getAssignmentsForVolunteer(bob.id)).toHaveLength(1)
  })

  it('throws when schedule is not found', async () => {
    await expect(
      useCase.execute({ assignmentId: assignment.id, editionId: 'unknown' })
    ).rejects.toThrow()
  })
})
