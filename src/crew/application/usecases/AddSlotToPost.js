import { TimeWindow } from '../../domain/model/TimeWindow.js'

export class AddSlotToPost {
  #repo

  constructor(postRepository) {
    this.#repo = postRepository
  }

  async execute({ postId, day, startTime, endTime }) {
    const post = await this.#repo.findById(postId)
    if (!post) throw new Error(`Post not found: ${postId}`)
    const slot = post.addSlot(new TimeWindow(day, startTime, endTime))
    await this.#repo.save(post)
    return slot
  }
}
