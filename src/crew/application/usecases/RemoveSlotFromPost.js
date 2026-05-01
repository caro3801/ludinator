export class RemoveSlotFromPost {
  #postRepo
  #scheduleRepo

  constructor(postRepository, scheduleRepository) {
    this.#postRepo = postRepository
    this.#scheduleRepo = scheduleRepository
  }

  async execute({ postId, slotId, editionId }) {
    const post = await this.#postRepo.findById(postId)
    if (!post) throw new Error(`Post not found: ${postId}`)

    post.removeSlot(slotId)
    await this.#postRepo.save(post)

    if (editionId) {
      const schedule = await this.#scheduleRepo.findByEdition(editionId)
      if (schedule) {
        schedule.removeAssignmentsForSlot(slotId)
        await this.#scheduleRepo.save(schedule)
      }
    }
  }
}
