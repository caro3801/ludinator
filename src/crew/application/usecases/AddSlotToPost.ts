import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'
import { SlotAddedToPost } from '../../domain/events'
import { PostId, SlotId } from '../../../shared/types'

interface AddSlotToPostParams {
  post: { id: PostId, name: string, minVolunteers: number, slots: { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } }[] }
  day: string
  startTime: string
  endTime: string
}

export class AddSlotToPost {
  execute({ post: postData, day, startTime, endTime }: AddSlotToPostParams): SlotAddedToPost {
    const post = Post.fromJSON(postData)
    post.addSlot(new TimeWindow(day, startTime, endTime))
    return new SlotAddedToPost({ post: post.toJSON() })
  }
}
