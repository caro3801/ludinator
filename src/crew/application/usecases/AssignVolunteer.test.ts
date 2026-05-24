import { describe, it, expect } from 'vitest'
import { AssignVolunteer } from './AssignVolunteer'
import { VolunteerAssigned } from '../../domain/events'
import { Volunteer } from '../../domain/model/Volunteer'
import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'

interface Assignment {
  id: string
  volunteerId: string
  slotId: string
}

interface ScheduleJSON {
  id: string
  editionId: string
  assignments: Assignment[]
  conflicts?: { volunteerId: string, slotIdA: string, slotIdB: string }[]
}

interface SlotJSON {
  id: string
  postId: string
  window: { day: string, startTime: string, endTime: string }
}

interface VolunteerJSON {
  id: string
  name: string
}

describe('AssignVolunteer', () => {
  it('emits VolunteerAssigned with assignment in schedule', () => {
    const volunteer: VolunteerJSON = Volunteer.create('Alice').toJSON() as VolunteerJSON
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slot: SlotJSON = p.slots[0].toJSON() as SlotJSON
    const event = new AssignVolunteer().execute({ volunteer, slot, schedule: null, editionId: 'edition-2024' })
    expect(event).toBeInstanceOf(VolunteerAssigned)
    expect(event.payload.editionId).toBe('edition-2024')
    expect((event.payload as ScheduleJSON).assignments).toHaveLength(1)
    expect((event.payload as ScheduleJSON).assignments[0].volunteerId).toBe(volunteer.id)
    expect((event.payload as ScheduleJSON).assignments[0].slotId).toBe(slot.id)
  })

  it('adds to existing schedule when provided', () => {
    const v1: VolunteerJSON = Volunteer.create('Alice').toJSON() as VolunteerJSON
    const v2: VolunteerJSON = Volunteer.create('Bob').toJSON() as VolunteerJSON
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    p.addSlot(new TimeWindow('samedi', '14:00', '17:00'))
    const slot1: SlotJSON = p.slots[0].toJSON() as SlotJSON
    const slot2: SlotJSON = p.slots[1].toJSON() as SlotJSON

    const first = new AssignVolunteer().execute({ volunteer: v1, slot: slot1, schedule: null, editionId: 'edition-2024' })
    const schedulePayload = first.payload as ScheduleJSON
    const second = new AssignVolunteer().execute({ volunteer: v2, slot: slot2, schedule: schedulePayload, editionId: 'edition-2024' })
    expect((second.payload as ScheduleJSON).assignments).toHaveLength(2)
  })
})
