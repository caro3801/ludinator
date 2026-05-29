import { describe, it, expect } from 'vitest'
import { CopySlotsToPost } from './CopySlotsToPost'
import { SlotsCopiedToPost } from '../../domain/events'
import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'

describe('CopySlotsToPost', () => {
  it('copies all slots from source to target post', () => {
    const sourcePost = Post.create('Source', 1)
    sourcePost.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    sourcePost.addSlot(new TimeWindow('samedi', '14:00', '18:00'))
    const targetPost = Post.create('Target', 1)
    
    const event = new CopySlotsToPost().execute({
      sourcePost: sourcePost.toJSON(),
      targetPost: targetPost.toJSON()
    })
    
    expect(event).toBeInstanceOf(SlotsCopiedToPost)
    expect(event.payload.sourcePost.slots).toHaveLength(2)
    expect(event.payload.targetPost.slots).toHaveLength(2)
  })

  it('ignores duplicate slots already in target post', () => {
    const sourcePost = Post.create('Source', 1)
    sourcePost.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    sourcePost.addSlot(new TimeWindow('samedi', '14:00', '18:00'))
    
    const targetPost = Post.create('Target', 1)
    targetPost.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    
    const event = new CopySlotsToPost().execute({
      sourcePost: sourcePost.toJSON(),
      targetPost: targetPost.toJSON()
    })
    
    expect(event).toBeInstanceOf(SlotsCopiedToPost)
    expect(event.payload.targetPost.slots).toHaveLength(2)
    expect(event.payload.copiedSlotCount).toBe(1)
  })
})
