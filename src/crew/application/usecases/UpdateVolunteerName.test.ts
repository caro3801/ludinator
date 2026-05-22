import { describe, it, expect } from 'vitest'
import { UpdateVolunteerName } from './UpdateVolunteerName'
import { VolunteerNameUpdated } from '../../domain/events'
import { Volunteer } from '../../domain/model/Volunteer'

describe('UpdateVolunteerName', () => {
  it('emits VolunteerNameUpdated with new name', () => {
    const volunteer = Volunteer.create('Alice').toJSON()
    const event = new UpdateVolunteerName().execute({ volunteer, name: 'Bob' })
    expect(event).toBeInstanceOf(VolunteerNameUpdated)
    expect(event.payload.name).toBe('Bob')
  })

  it('throws on empty name', () => {
    const volunteer = Volunteer.create('Alice').toJSON()
    expect(() => new UpdateVolunteerName().execute({ volunteer, name: '' })).toThrow()
  })
})
