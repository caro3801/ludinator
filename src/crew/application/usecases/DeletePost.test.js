import { describe, it, expect, beforeEach } from 'vitest'
import { DeletePost } from './DeletePost.js'
import { InMemoryPostRepository } from '../../adapters/storage/InMemoryPostRepository.js'
import { InMemoryScheduleRepository } from '../../adapters/storage/InMemoryScheduleRepository.js'
import { Post } from '../../domain/model/Post.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('DeletePost', () => {
  let postRepo, scheduleRepo, useCase, post, slot1, slot2

  beforeEach(async () => {
    postRepo = new InMemoryPostRepository()
    scheduleRepo = new InMemoryScheduleRepository()
    useCase = new DeletePost(postRepo, scheduleRepo)

    post = Post.create('Accueil', 2)
    slot1 = post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    slot2 = post.addSlot(new TimeWindow('sunday', '10:00', '13:00'))
    await postRepo.save(post)
  })

  it('removes the post from the repository', async () => {
    await useCase.execute({ postId: post.id, editionId: 'edition-2024' })
    expect(await postRepo.findById(post.id)).toBeNull()
  })

  it('removes all slot assignments from the schedule', async () => {
    const alice = Volunteer.create('Alice')
    const schedule = Schedule.create('edition-2024')
    schedule.assign(alice, slot1)
    schedule.assign(alice, slot2)
    await scheduleRepo.save(schedule)

    await useCase.execute({ postId: post.id, editionId: 'edition-2024' })

    const saved = await scheduleRepo.findByEdition('edition-2024')
    expect(saved.getAssignmentsForSlot(slot1.id)).toHaveLength(0)
    expect(saved.getAssignmentsForSlot(slot2.id)).toHaveLength(0)
  })

  it('works when no schedule exists for the edition', async () => {
    await expect(
      useCase.execute({ postId: post.id, editionId: 'edition-2024' })
    ).resolves.not.toThrow()
  })

  it('throws when post is not found', async () => {
    await expect(
      useCase.execute({ postId: 'unknown', editionId: 'edition-2024' })
    ).rejects.toThrow()
  })
})
