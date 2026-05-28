import { PostRepository } from '../../ports/PostRepository'
import { Post } from '../../domain/model/Post'
import { TimeSlot } from '../../domain/model/TimeSlot'
import { PostId, SlotId } from '../../../shared/types'

export class InMemoryPostRepository implements PostRepository {
  #store = new Map<PostId, Post>()

  async save(post: Post): Promise<void> { this.#store.set(post.id as PostId, post) }
  async findById(id: PostId): Promise<Post | null> { return this.#store.get(id) ?? null }
  async findAll(): Promise<Post[]> { return Array.from(this.#store.values()) }
  async delete(id: PostId): Promise<void> { this.#store.delete(id) }

  async findSlotById(slotId: SlotId): Promise<TimeSlot | null> {
    for (const post of this.#store.values()) {
      const slot = post.slots.find((s: TimeSlot) => s.id === slotId)
      if (slot) return slot
    }
    return null
  }
}
