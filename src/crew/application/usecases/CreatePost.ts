import { Post } from '../../domain/model/Post'
import { PostCreated } from '../../domain/events'

export class CreatePost {
  execute({ name, minVolunteers }) {
    const post = Post.create(name, minVolunteers)
    return new PostCreated({ post: post.toJSON() })
  }
}
