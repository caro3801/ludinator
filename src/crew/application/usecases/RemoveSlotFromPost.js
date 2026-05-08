import { Post } from '../../domain/model/Post.js'
import { SlotRemovedFromPost } from '../../domain/events.js'

export class RemoveSlotFromPost {
  execute({ post: postData, slotId }) {
    const post = Post.fromJSON(postData)
    post.removeSlot(slotId)
    return new SlotRemovedFromPost({ post: post.toJSON(), slotId })
  }
}
