import { describe, it, expect, beforeEach } from 'vitest'
import { Schedule } from './Schedule.js'
import { Volunteer } from './Volunteer.js'
import { Post } from './Post.js'
import { TimeWindow } from './TimeWindow.js'

describe('Schedule', () => {
  let schedule, alice, bob, accueil

  beforeEach(() => {
    schedule = Schedule.create('edition-2024')
    alice = Volunteer.create('Alice')
    bob = Volunteer.create('Bob')
    accueil = Post.create('Accueil', 2)
  })

  it('assigns a volunteer to a slot', () => {
    const slot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    const assignment = schedule.assign(alice, slot)
    expect(assignment.volunteerId).toBe(alice.id)
    expect(assignment.slotId).toBe(slot.id)
  })

  it('allows assignment even when the volunteer has a conflicting slot', () => {
    const slot1 = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    const bar = Post.create('Bar', 1)
    const slot2 = bar.addSlot(new TimeWindow('saturday', '11:00', '14:00'))

    expect(() => {
      schedule.assign(alice, slot1)
      schedule.assign(alice, slot2)
    }).not.toThrow()
  })

  it('allows same volunteer on non-overlapping slots', () => {
    const slot1 = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    const bar = Post.create('Bar', 1)
    const slot2 = bar.addSlot(new TimeWindow('saturday', '12:00', '15:00'))
    expect(() => {
      schedule.assign(alice, slot1)
      schedule.assign(alice, slot2)
    }).not.toThrow()
  })

  it('allows two different volunteers on the same slot', () => {
    const slot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    expect(() => {
      schedule.assign(alice, slot)
      schedule.assign(bob, slot)
    }).not.toThrow()
  })

  it('returns all assignments for a volunteer', () => {
    const slot1 = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    const bar = Post.create('Bar', 1)
    const slot2 = bar.addSlot(new TimeWindow('sunday', '10:00', '13:00'))
    schedule.assign(alice, slot1)
    schedule.assign(alice, slot2)
    expect(schedule.getAssignmentsForVolunteer(alice.id)).toHaveLength(2)
  })

  describe('removeAssignmentsForSlot', () => {
    it('removes all assignments for a given slot', () => {
      const slot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
      schedule.assign(alice, slot)
      schedule.assign(bob, slot)

      schedule.removeAssignmentsForSlot(slot.id)

      expect(schedule.getAssignmentsForSlot(slot.id)).toHaveLength(0)
    })

    it('does not affect assignments for other slots', () => {
      const slot1 = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
      const slot2 = accueil.addSlot(new TimeWindow('saturday', '14:00', '17:00'))
      schedule.assign(alice, slot1)
      schedule.assign(bob, slot2)

      schedule.removeAssignmentsForSlot(slot1.id)

      expect(schedule.getAssignmentsForSlot(slot2.id)).toHaveLength(1)
    })
  })

  describe('getConflicts', () => {
    it('returns empty array when no conflicts', () => {
      const slot1 = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
      const slot2 = accueil.addSlot(new TimeWindow('saturday', '14:00', '17:00'))
      schedule.assign(alice, slot1)
      schedule.assign(alice, slot2)
      expect(schedule.getConflicts()).toHaveLength(0)
    })

    it('returns a conflict when a volunteer has overlapping slots', () => {
      const slot1 = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
      const bar = Post.create('Bar', 1)
      const slot2 = bar.addSlot(new TimeWindow('saturday', '11:00', '14:00'))
      schedule.assign(alice, slot1)
      schedule.assign(alice, slot2)

      const conflicts = schedule.getConflicts()
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].volunteerId).toBe(alice.id)
      expect([conflicts[0].slotIdA, conflicts[0].slotIdB]).toContain(slot1.id)
      expect([conflicts[0].slotIdA, conflicts[0].slotIdB]).toContain(slot2.id)
    })

    it('does not flag conflicts between different volunteers', () => {
      const slot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
      schedule.assign(alice, slot)
      schedule.assign(bob, slot)
      expect(schedule.getConflicts()).toHaveLength(0)
    })
  })
})
