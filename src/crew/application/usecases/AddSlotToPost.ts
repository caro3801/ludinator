import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'
import { SlotAddedToPost } from '../../domain/events'

export class AddSlotToPost {
  execute({ post: postData, day, startTime, endTime }) {
    const post = Post.fromJSON(postData)
    post.addSlot(new TimeWindow(day, startTime, endTime))
    return new SlotAddedToPost({ post: post.toJSON() })
  }
}
