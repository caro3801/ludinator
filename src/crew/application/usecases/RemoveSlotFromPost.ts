import { Post } from '../../domain/model/Post'
import { SlotRemovedFromPost } from '../../domain/events'
import { PostId, SlotId } from '../../../shared/types'

interface RemoveSlotFromPostParams {
  post: { id: PostId, name: string, minVolunteers: number, slots: { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } }[] }
  slotId: SlotId
}

export class RemoveSlotFromPost {
  execute({ post: postData, slotId }: RemoveSlotFromPostParams): SlotRemovedFromPost {
    const post = Post.fromJSON(postData)
    post.removeSlot(slotId)
    return new SlotRemovedFromPost({ post: post.toJSON(), slotId })
  }
}
