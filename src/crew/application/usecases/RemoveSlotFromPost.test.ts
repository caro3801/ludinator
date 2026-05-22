import { describe, it, expect } from 'vitest'
import { RemoveSlotFromPost } from './RemoveSlotFromPost'
import { SlotRemovedFromPost } from '../../domain/events'
import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'

describe('RemoveSlotFromPost', () => {
  it('emits SlotRemovedFromPost with slot removed from post and slotId in payload', () => {
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slotId = p.slots[0].id
    const event = new RemoveSlotFromPost().execute({ post: p.toJSON(), slotId })
    expect(event).toBeInstanceOf(SlotRemovedFromPost)
    expect(event.payload.post.slots).toHaveLength(0)
    expect(event.payload.slotId).toBe(slotId)
  })
})
