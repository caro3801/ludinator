import { describe, it, expect } from 'vitest'
import { TimeSlot } from './TimeSlot.js'
import { TimeWindow } from './TimeWindow.js'

describe('TimeSlot', () => {
  const window = new TimeWindow('saturday', '10:00', '12:00')

  describe('addRegistration', () => {
    it('adds a registration and returns it', () => {
      const slot = TimeSlot.create('act-1', window)
      const reg = slot.addRegistration('Alice')
      expect(reg.id).toBeDefined()
      expect(reg.personName).toBe('Alice')
      expect(slot.registrations).toHaveLength(1)
    })

    it('rejects an empty name', () => {
      const slot = TimeSlot.create('act-1', window)
      expect(() => slot.addRegistration('')).toThrow()
    })

    it('registration is not waitlisted when under capacity', () => {
      const slot = TimeSlot.create('act-1', window, { max: 2 })
      expect(slot.addRegistration('Alice').waitlisted).toBe(false)
    })

    it('registration is waitlisted when at or over maxParticipants', () => {
      const slot = TimeSlot.create('act-1', window, { max: 1 })
      slot.addRegistration('Alice')
      expect(slot.addRegistration('Bob').waitlisted).toBe(true)
    })

    it('registration is never waitlisted when maxParticipants is null', () => {
      const slot = TimeSlot.create('act-1', window)
      slot.addRegistration('Alice')
      slot.addRegistration('Bob')
      expect(slot.registrations[1].waitlisted).toBe(false)
    })
  })

  describe('updateRegistration', () => {
    it('updates the person name', () => {
      const slot = TimeSlot.create('act-1', window)
      const reg = slot.addRegistration('Alice')
      slot.updateRegistration(reg.id, 'Alice M.')
      expect(slot.registrations[0].personName).toBe('Alice M.')
    })

    it('throws when registration is not found', () => {
      const slot = TimeSlot.create('act-1', window)
      expect(() => slot.updateRegistration('nope', 'Alice')).toThrow()
    })
  })

  describe('removeRegistration', () => {
    it('removes a registration by id', () => {
      const slot = TimeSlot.create('act-1', window)
      const reg = slot.addRegistration('Alice')
      slot.removeRegistration(reg.id)
      expect(slot.registrations).toHaveLength(0)
    })
  })

  describe('registrationCount', () => {
    it('returns the number of registrations', () => {
      const slot = TimeSlot.create('act-1', window)
      slot.addRegistration('Alice')
      slot.addRegistration('Bob')
      expect(slot.registrationCount).toBe(2)
    })
  })

  describe('isOverCapacity', () => {
    it('is true when any registration is waitlisted', () => {
      const slot = TimeSlot.create('act-1', window, { max: 1 })
      slot.addRegistration('Alice')
      slot.addRegistration('Bob') // waitlisted
      expect(slot.isOverCapacity).toBe(true)
    })

    it('is false when no registration is waitlisted', () => {
      const slot = TimeSlot.create('act-1', window, { max: 2 })
      slot.addRegistration('Alice')
      expect(slot.isOverCapacity).toBe(false)
    })

    it('is false when maxParticipants is null', () => {
      const slot = TimeSlot.create('act-1', window)
      slot.addRegistration('Alice')
      slot.addRegistration('Bob')
      expect(slot.isOverCapacity).toBe(false)
    })

    it('becomes false again after removing the last waitlisted registration', () => {
      const slot = TimeSlot.create('act-1', window, { max: 1 })
      slot.addRegistration('Alice')
      const bob = slot.addRegistration('Bob') // waitlisted
      slot.removeRegistration(bob.id)
      expect(slot.isOverCapacity).toBe(false)
    })
  })

  describe('isUnderstaffed', () => {
    it('is true when registrationCount < minParticipants', () => {
      const slot = TimeSlot.create('act-1', window, { min: 5 })
      slot.addRegistration('Alice')
      expect(slot.isUnderstaffed).toBe(true)
    })

    it('is false when minParticipants is null', () => {
      expect(TimeSlot.create('act-1', window).isUnderstaffed).toBe(false)
    })
  })

  it('serialises and deserialises registrations correctly', () => {
    const slot = TimeSlot.create('act-1', window)
    slot.addRegistration('Alice')
    const slot2 = TimeSlot.fromJSON(slot.toJSON())
    expect(slot2.registrations[0].personName).toBe('Alice')
  })
})
