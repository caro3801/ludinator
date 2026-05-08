import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'
import { SlotUpdatedInPost } from '../../domain/events.js'

export class UpdateSlotInPost {
  execute({ post: postData, slotId, day, startTime, endTime }) {
    const post = Post.fromJSON(postData)
    post.updateSlotWindow(slotId, new TimeWindow(day, startTime, endTime))
    return new SlotUpdatedInPost({ post: post.toJSON() })
  }
}
