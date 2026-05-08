import { describe, it, expect } from 'vitest'
import { UnassignVolunteer } from './UnassignVolunteer.js'
import { VolunteerUnassigned } from '../../domain/events.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

describe('UnassignVolunteer', () => {
  it('emits VolunteerUnassigned with assignment removed', () => {
    const volunteer = Volunteer.create('Alice')
    const p = Post.create('Accueil', 2)
    p.addSlot(new TimeWindow('samedi', '09:00', '12:00'))
    const slot = p.slots[0]
    const schedule = Schedule.create('edition-2024')
    schedule.assign(volunteer, slot)
    const assignmentId = schedule.toJSON().assignments[0].id

    const event = new UnassignVolunteer().execute({ schedule: schedule.toJSON(), assignmentId })
    expect(event).toBeInstanceOf(VolunteerUnassigned)
    expect(event.payload.assignments).toHaveLength(0)
  })
})
