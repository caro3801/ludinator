import { PostRepository } from '../../ports/PostRepository'
import { Post } from '../../domain/model/Post'
import { TimeSlot } from '../../domain/model/TimeSlot'
import { PostId, SlotId } from '../../../shared/types'

const KEY = 'crew:posts'

interface PostData {
  id: PostId
  name: string
  minVolunteers: number
  slots: { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } }[]
}

export class LocalStoragePostRepository implements PostRepository {
  #read(): Record<PostId, PostData> {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  }

  #write(data: Record<PostId, PostData>): void {
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  async save(post: Post): Promise<void> {
    const data = this.#read()
    data[post.id] = post.toJSON()
    this.#write(data)
  }

  async findById(id: PostId): Promise<Post | null> {
    const data = this.#read()
    return data[id] ? Post.fromJSON(data[id]) : null
  }

  async findAll(): Promise<Post[]> {
    return Object.values(this.#read()).map((p: PostData) => Post.fromJSON(p))
  }

  async delete(id: PostId): Promise<void> {
    const data = this.#read()
    delete data[id]
    this.#write(data)
  }

  async findSlotById(slotId: SlotId): Promise<TimeSlot | null> {
    for (const raw of Object.values(this.#read())) {
      const post = Post.fromJSON(raw)
      const slot = post.slots.find(s => s.id === slotId)
      if (slot) return slot
    }
    return null
  }
}
