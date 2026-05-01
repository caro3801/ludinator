import { describe, it, expect, beforeEach } from 'vitest'
import { AssignVolunteer } from './AssignVolunteer.js'
import { InMemoryVolunteerRepository } from '../../adapters/storage/InMemoryVolunteerRepository.js'
import { InMemoryPostRepository } from '../../adapters/storage/InMemoryPostRepository.js'
import { InMemoryScheduleRepository } from '../../adapters/storage/InMemoryScheduleRepository.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('AssignVolunteer', () => {
  let volunteerRepo, postRepo, scheduleRepo, useCase
  let alice, accueil, morningSlot

  beforeEach(async () => {
    volunteerRepo = new InMemoryVolunteerRepository()
    postRepo = new InMemoryPostRepository()
    scheduleRepo = new InMemoryScheduleRepository()
    useCase = new AssignVolunteer(volunteerRepo, postRepo, scheduleRepo)

    alice = Volunteer.create('Alice')
    await volunteerRepo.save(alice)

    accueil = Post.create('Accueil', 2)
    morningSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    await postRepo.save(accueil)
  })

  it('assigns a volunteer to a slot and persists the schedule', async () => {
    const assignment = await useCase.execute({
      volunteerId: alice.id,
      slotId: morningSlot.id,
      editionId: 'edition-2024',
    })

    expect(assignment.volunteerId).toBe(alice.id)
    expect(assignment.slotId).toBe(morningSlot.id)
    expect(await scheduleRepo.findByEdition('edition-2024')).not.toBeNull()
  })

  it('creates a new schedule when none exists for the edition', async () => {
    await useCase.execute({
      volunteerId: alice.id,
      slotId: morningSlot.id,
      editionId: 'edition-2024',
    })
    const schedule = await scheduleRepo.findByEdition('edition-2024')
    expect(schedule).not.toBeNull()
    expect(schedule.getAssignmentsForVolunteer(alice.id)).toHaveLength(1)
  })

  it('allows assignment even when the volunteer has a conflicting slot', async () => {
    const bar = Post.create('Bar', 1)
    const conflictingSlot = bar.addSlot(new TimeWindow('saturday', '11:00', '14:00'))
    await postRepo.save(bar)

    await useCase.execute({ volunteerId: alice.id, slotId: morningSlot.id, editionId: 'edition-2024' })

    await expect(useCase.execute({
      volunteerId: alice.id,
      slotId: conflictingSlot.id,
      editionId: 'edition-2024',
    })).resolves.toBeDefined()
  })

  it('throws when volunteer is not found', async () => {
    await expect(useCase.execute({
      volunteerId: 'unknown',
      slotId: morningSlot.id,
      editionId: 'edition-2024',
    })).rejects.toThrow()
  })

  it('throws when slot is not found', async () => {
    await expect(useCase.execute({
      volunteerId: alice.id,
      slotId: 'unknown',
      editionId: 'edition-2024',
    })).rejects.toThrow()
  })
})
