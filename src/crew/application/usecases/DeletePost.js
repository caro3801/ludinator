export class DeletePost {
  #postRepo
  #scheduleRepo

  constructor(postRepository, scheduleRepository) {
    this.#postRepo = postRepository
    this.#scheduleRepo = scheduleRepository
  }

  async execute({ postId, editionId }) {
    const post = await this.#postRepo.findById(postId)
    if (!post) throw new Error(`Post not found: ${postId}`)

    if (editionId) {
      const schedule = await this.#scheduleRepo.findByEdition(editionId)
      if (schedule) {
        for (const slot of post.slots) {
          schedule.removeAssignmentsForSlot(slot.id)
        }
        await this.#scheduleRepo.save(schedule)
      }
    }

    await this.#postRepo.delete(postId)
  }
}
