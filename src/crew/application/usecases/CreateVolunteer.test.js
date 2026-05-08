import { describe, it, expect } from 'vitest'
import { CreateVolunteer } from './CreateVolunteer.js'
import { VolunteerCreated } from '../../domain/events.js'

describe('CreateVolunteer', () => {
  it('emits VolunteerCreated with correct name', () => {
    const event = new CreateVolunteer().execute({ name: 'Alice' })
    expect(event).toBeInstanceOf(VolunteerCreated)
    expect(event.payload.name).toBe('Alice')
  })

  it('throws on empty name', () => {
    expect(() => new CreateVolunteer().execute({ name: '' })).toThrow()
  })
})
