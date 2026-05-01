import { describe, it, expect } from 'vitest'
import { Activity } from './Activity.js'
import { TimeWindow } from './TimeWindow.js'

describe('Activity', () => {
  describe('create', () => {
    it('creates an activity with a name', () => {
      const a = Activity.create('Escape Game')
      expect(a.name.value).toBe('Escape Game')
      expect(a.id).toBeDefined()
    })

    it('stores an optional location', () => {
      const a = Activity.create('Quiz', 'Salle B')
      expect(a.location).toBe('Salle B')
    })

    it('defaults location to null', () => {
      expect(Activity.create('Quiz').location).toBeNull()
    })

    it('rejects an invalid name', () => {
      expect(() => Activity.create('')).toThrow()
    })

    it('starts with no slots', () => {
      expect(Activity.create('Quiz').slots).toHaveLength(0)
    })
  })

  describe('updateName', () => {
    it('changes the activity name', () => {
      const a = Activity.create('Quiz')
      a.updateName('Super Quiz')
      expect(a.name.value).toBe('Super Quiz')
    })

    it('rejects an empty name', () => {
      const a = Activity.create('Quiz')
      expect(() => a.updateName('')).toThrow()
    })
  })

  describe('addSlot', () => {
    it('adds a slot and returns it', () => {
      const a = Activity.create('Quiz')
      const slot = a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
      expect(slot.id).toBeDefined()
      expect(slot.window.day).toBe('saturday')
      expect(a.slots).toHaveLength(1)
    })

    it('stores optional min and max participants', () => {
      const a = Activity.create('Quiz')
      const slot = a.addSlot(new TimeWindow('saturday', '10:00', '12:00'), { min: 5, max: 20 })
      expect(slot.minParticipants).toBe(5)
      expect(slot.maxParticipants).toBe(20)
    })

    it('defaults min and max to null', () => {
      const a = Activity.create('Quiz')
      const slot = a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
      expect(slot.minParticipants).toBeNull()
      expect(slot.maxParticipants).toBeNull()
    })
  })

  describe('removeSlot', () => {
    it('removes a slot by id', () => {
      const a = Activity.create('Quiz')
      const slot = a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
      a.removeSlot(slot.id)
      expect(a.slots).toHaveLength(0)
    })
  })
})
