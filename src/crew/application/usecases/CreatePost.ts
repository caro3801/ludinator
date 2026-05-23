import { Post } from '../../domain/model/Post'
import { PostCreated } from '../../domain/events'

interface CreatePostParams {
  name: string
  minVolunteers: number
}

export class CreatePost {
  execute({ name, minVolunteers }: CreatePostParams): PostCreated {
    const post = Post.create(name, minVolunteers)
    return new PostCreated({ post: post.toJSON() })
  }
}
