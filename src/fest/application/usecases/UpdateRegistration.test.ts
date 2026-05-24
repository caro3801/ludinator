import { describe, it, expect } from 'vitest'
import { UpdateRegistration } from './UpdateRegistration'
import { RegistrationUpdated } from '../../domain/events'
import { Activity } from '../../domain/model/Activity'
import { TimeWindow } from '../../domain/model/TimeWindow'

interface ActivityJSON {
  id: string
  name: string
  location: string | null
  slots: {
    id: string
    activityId: string
    window: { day: string; startTime: string; endTime: string }
    min: number | null
    max: number | null
    registrations: { id: string; personName: string; waitlisted: boolean }[]
  }[]
}

describe('UpdateRegistration', () => {
  it('emits RegistrationUpdated with updated name', () => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    const slot = a.slots[0]
    slot.addRegistration('Alice')
    const activityJSON = a.toJSON() as ActivityJSON
    const regId = activityJSON.slots[0].registrations[0].id

    const event = new UpdateRegistration().execute({ activity: activityJSON, slotId: slot.id, registrationId: regId, personName: 'Alice M.' })
    expect(event).toBeInstanceOf(RegistrationUpdated)
    expect((event.payload as { slots: { registrations: { personName: string }[] }[] }).slots[0].registrations[0].personName).toBe('Alice M.')
  })
})
