import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'
import { SlotUpdatedInPost } from '../../domain/events'
import { PostId, SlotId } from '../../../shared/types'

interface UpdateSlotInPostParams {
  post: { id: PostId, name: string, minVolunteers: number, slots: { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } }[] }
  slotId: SlotId
  day: string
  startTime: string
  endTime: string
}

export class UpdateSlotInPost {
  execute({ post: postData, slotId, day, startTime, endTime }: UpdateSlotInPostParams): SlotUpdatedInPost {
    const post = Post.fromJSON(postData)
    post.updateSlotWindow(slotId, new TimeWindow(day, startTime, endTime))
    return new SlotUpdatedInPost({ post: post.toJSON() })
  }
}
