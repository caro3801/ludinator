import { describe, it, expect } from 'vitest'
import { AddSlotToActivity } from './AddSlotToActivity.js'
import { SlotAddedToActivity } from '../../domain/events.js'
import { Activity } from '../../domain/model/Activity.js'

describe('AddSlotToActivity', () => {
  it('emits SlotAddedToActivity with updated slots', () => {
    const activity = Activity.create('Quiz').toJSON()
    const event = new AddSlotToActivity().execute({ activity, day: 'saturday', startTime: '10:00', endTime: '12:00' })
    expect(event).toBeInstanceOf(SlotAddedToActivity)
    expect(event.payload.slots).toHaveLength(1)
    expect(event.payload.slots[0].window.day).toBe('saturday')
  })

  it('stores optional min and max participants', () => {
    const activity = Activity.create('Quiz').toJSON()
    const event = new AddSlotToActivity().execute({ activity, day: 'saturday', startTime: '10:00', endTime: '12:00', min: 5, max: 30 })
    expect(event.payload.slots[0].minParticipants).toBe(5)
    expect(event.payload.slots[0].maxParticipants).toBe(30)
  })

  it('throws when startTime >= endTime', () => {
    const activity = Activity.create('Quiz').toJSON()
    expect(() => new AddSlotToActivity().execute({ activity, day: 'saturday', startTime: '12:00', endTime: '09:00' })).toThrow()
  })
})
