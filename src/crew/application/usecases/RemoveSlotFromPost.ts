import { Post } from '../../domain/model/Post'
import { SlotRemovedFromPost } from '../../domain/events'

export class RemoveSlotFromPost {
  execute({ post: postData, slotId }) {
    const post = Post.fromJSON(postData)
    post.removeSlot(slotId)
    return new SlotRemovedFromPost({ post: post.toJSON(), slotId })
  }
}
