import { PostRepository } from '../../ports/PostRepository.js'
import { Post } from '../../domain/model/Post.js'

const KEY = 'crew:posts'

export class LocalStoragePostRepository extends PostRepository {
  #read() {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  }

  #write(data) {
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  async save(post) {
    const data = this.#read()
    data[post.id] = post.toJSON()
    this.#write(data)
  }

  async findById(id) {
    const data = this.#read()
    return data[id] ? Post.fromJSON(data[id]) : null
  }

  async findAll() {
    return Object.values(this.#read()).map(p => Post.fromJSON(p))
  }

  async delete(id) {
    const data = this.#read()
    delete data[id]
    this.#write(data)
  }

  async findSlotById(slotId) {
    for (const raw of Object.values(this.#read())) {
      const post = Post.fromJSON(raw)
      const slot = post.slots.find(s => s.id === slotId)
      if (slot) return slot
    }
    return null
  }
}
