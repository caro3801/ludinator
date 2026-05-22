import { Post } from '../../domain/model/Post'
import { PostNameUpdated } from '../../domain/events'

export class UpdatePostName {
  execute({ post: postData, name }) {
    const post = Post.fromJSON(postData)
    post.updateName(name)
    return new PostNameUpdated({ post: post.toJSON() })
  }
}
