import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'
import { SlotUpdatedInPost } from '../../domain/events'

export class UpdateSlotInPost {
  execute({ post: postData, slotId, day, startTime, endTime }) {
    const post = Post.fromJSON(postData)
    post.updateSlotWindow(slotId, new TimeWindow(day, startTime, endTime))
    return new SlotUpdatedInPost({ post: post.toJSON() })
  }
}
