import { describe, it, expect } from 'vitest'
import { AssignVolunteer } from './AssignVolunteer.js'
import { VolunteerAssigned } from '../../domain/events.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('AssignVolunteer', () => {
  it('emits VolunteerAssigned with assignment in schedule', () => {
    const volunteer = Volunteer.create('Alice').toJSON()
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slot = p.slots[0].toJSON()
    const event = new AssignVolunteer().execute({ volunteer, slot, schedule: null, editionId: 'edition-2024' })
    expect(event).toBeInstanceOf(VolunteerAssigned)
    expect(event.payload.editionId).toBe('edition-2024')
    expect(event.payload.assignments).toHaveLength(1)
    expect(event.payload.assignments[0].volunteerId).toBe(volunteer.id)
    expect(event.payload.assignments[0].slotId).toBe(slot.id)
  })

  it('adds to existing schedule when provided', () => {
    const v1 = Volunteer.create('Alice').toJSON()
    const v2 = Volunteer.create('Bob').toJSON()
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    p.addSlot(new TimeWindow('samedi', '14:00', '17:00'))
    const slot1 = p.slots[0].toJSON()
    const slot2 = p.slots[1].toJSON()

    const first = new AssignVolunteer().execute({ volunteer: v1, slot: slot1, schedule: null, editionId: 'edition-2024' })
    const second = new AssignVolunteer().execute({ volunteer: v2, slot: slot2, schedule: first.payload, editionId: 'edition-2024' })
    expect(second.payload.assignments).toHaveLength(2)
  })
})
