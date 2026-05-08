import { Post } from '../../domain/model/Post.js'
import { PostCreated } from '../../domain/events.js'

export class CreatePost {
  execute({ name, minVolunteers }) {
    const post = Post.create(name, minVolunteers)
    return new PostCreated({ post: post.toJSON() })
  }
}
