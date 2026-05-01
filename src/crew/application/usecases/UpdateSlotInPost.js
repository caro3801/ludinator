import { TimeWindow } from '../../domain/model/TimeWindow.js'

export class UpdateSlotInPost {
  #repo

  constructor(postRepository) {
    this.#repo = postRepository
  }

  async execute({ postId, slotId, day, startTime, endTime }) {
    const post = await this.#repo.findById(postId)
    if (!post) throw new Error(`Post not found: ${postId}`)
    const slot = post.updateSlotWindow(slotId, new TimeWindow(day, startTime, endTime))
    await this.#repo.save(post)
    return slot
  }
}
