import { describe, it, expect, beforeEach } from 'vitest'
import { RemoveSlotFromPost } from './RemoveSlotFromPost.js'
import { InMemoryPostRepository } from '../../adapters/storage/InMemoryPostRepository.js'
import { InMemoryScheduleRepository } from '../../adapters/storage/InMemoryScheduleRepository.js'
import { InMemoryVolunteerRepository } from '../../adapters/storage/InMemoryVolunteerRepository.js'
import { Post } from '../../domain/model/Post.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('RemoveSlotFromPost', () => {
  let postRepo, scheduleRepo, useCase, post, slot

  beforeEach(async () => {
    postRepo = new InMemoryPostRepository()
    scheduleRepo = new InMemoryScheduleRepository()
    useCase = new RemoveSlotFromPost(postRepo, scheduleRepo)

    post = Post.create('Accueil', 2)
    slot = post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    await postRepo.save(post)
  })

  it('removes the slot from the post', async () => {
    await useCase.execute({ postId: post.id, slotId: slot.id })
    const saved = await postRepo.findById(post.id)
    expect(saved.slots).toHaveLength(0)
  })

  it('removes assignments for the deleted slot from the schedule', async () => {
    const volunteer = Volunteer.create('Alice')
    const schedule = Schedule.create('edition-2024')
    schedule.assign(volunteer, slot)
    await scheduleRepo.save(schedule)

    await useCase.execute({ postId: post.id, slotId: slot.id, editionId: 'edition-2024' })

    const saved = await scheduleRepo.findByEdition('edition-2024')
    expect(saved.getAssignmentsForSlot(slot.id)).toHaveLength(0)
  })

  it('throws when post is not found', async () => {
    await expect(useCase.execute({ postId: 'unknown', slotId: slot.id })).rejects.toThrow()
  })
})
