import { Post } from '../../domain/model/Post'
import { PostNameUpdated } from '../../domain/events'
import { PostId, SlotId } from '../../../shared/types'

interface UpdatePostNameParams {
  post: { id: PostId, name: string, minVolunteers: number, slots: { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } }[] }
  name: string
}

export class UpdatePostName {
  execute({ post: postData, name }: UpdatePostNameParams): PostNameUpdated {
    const post = Post.fromJSON(postData)
    post.updateName(name)
    return new PostNameUpdated({ post: post.toJSON() })
  }
}
