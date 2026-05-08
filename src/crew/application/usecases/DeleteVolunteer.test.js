import { describe, it, expect } from 'vitest'
import { DeleteVolunteer } from './DeleteVolunteer.js'
import { VolunteerDeleted } from '../../domain/events.js'

describe('DeleteVolunteer', () => {
  it('emits VolunteerDeleted with correct volunteerId', () => {
    const event = new DeleteVolunteer().execute({ volunteerId: 'v-1' })
    expect(event).toBeInstanceOf(VolunteerDeleted)
    expect(event.payload.volunteerId).toBe('v-1')
  })
})
