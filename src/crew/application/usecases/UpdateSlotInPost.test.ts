import { describe, it, expect } from 'vitest'
import { UpdateSlotInPost } from './UpdateSlotInPost'
import { SlotUpdatedInPost } from '../../domain/events'
import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'

describe('UpdateSlotInPost', () => {
  it('emits SlotUpdatedInPost with updated window', () => {
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slotId = p.slots[0].id
    const event = new UpdateSlotInPost().execute({ post: p.toJSON(), slotId, day: 'dimanche', startTime: '10:00', endTime: '14:00' })
    expect(event).toBeInstanceOf(SlotUpdatedInPost)
    expect(event.payload.slots[0].window.day).toBe('dimanche')
    expect(event.payload.slots[0].window.startTime).toBe('10:00')
  })

  it('throws when slotId not found', () => {
    const post = Post.create('Accueil', 2).toJSON()
    expect(() => new UpdateSlotInPost().execute({ post, slotId: 'unknown', day: 'samedi', startTime: '09:00', endTime: '12:00' })).toThrow()
  })
})
