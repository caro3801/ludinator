import { PostRepository } from '../../ports/PostRepository.js'

export class InMemoryPostRepository extends PostRepository {
  #store = new Map()

  async save(post) { this.#store.set(post.id, post) }
  async findById(id) { return this.#store.get(id) ?? null }
  async findAll() { return [...this.#store.values()] }
  async delete(id) { this.#store.delete(id) }

  async findSlotById(slotId) {
    for (const post of this.#store.values()) {
      const slot = post.slots.find(s => s.id === slotId)
      if (slot) return slot
    }
    return null
  }
}
