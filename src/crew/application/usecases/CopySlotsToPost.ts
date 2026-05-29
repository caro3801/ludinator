import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'
import { SlotsCopiedToPost } from '../../domain/events'
import { PostId, SlotId } from '../../../shared/types'

interface CopySlotsToPostParams {
  sourcePost: { id: PostId, name: string, minVolunteers: number, slots: { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } }[] }
  targetPost: { id: PostId, name: string, minVolunteers: number, slots: { id: SlotId, postId: PostId, window: { day: string, startTime: string, endTime: string } }[] }
}

export class CopySlotsToPost {
  execute({ sourcePost: sourcePostData, targetPost: targetPostData }: CopySlotsToPostParams): SlotsCopiedToPost {
    const sourcePost = Post.fromJSON(sourcePostData)
    const targetPost = Post.fromJSON(targetPostData)

    let copiedSlotCount = 0

    for (const sourceSlot of sourcePost.slots) {
      const isDuplicate = targetPost.slots.some(targetSlot =>
        targetSlot.window.day === sourceSlot.window.day &&
        targetSlot.window.startTime === sourceSlot.window.startTime &&
        targetSlot.window.endTime === sourceSlot.window.endTime
      )

      if (!isDuplicate) {
        targetPost.addSlot(new TimeWindow(
          sourceSlot.window.day,
          sourceSlot.window.startTime,
          sourceSlot.window.endTime
        ))
        copiedSlotCount++
      }
    }

    return new SlotsCopiedToPost({
      sourcePost: sourcePost.toJSON(),
      targetPost: targetPost.toJSON(),
      copiedSlotCount
    })
  }
}
