import { Post } from '../domain/model/Post'

/**
 * Port interface for post persistence
 */
export interface PostRepository {
  save(post: Post): Promise<void>
  findById(id: string): Promise<Post | null>
  findAll(): Promise<Post[]>
  delete(id: string): Promise<void>
}
