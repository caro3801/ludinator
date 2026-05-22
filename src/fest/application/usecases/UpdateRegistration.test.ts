import { describe, it, expect } from 'vitest'
import { UpdateRegistration } from './UpdateRegistration'
import { RegistrationUpdated } from '../../domain/events'
import { Activity } from '../../domain/model/Activity'
import { TimeWindow } from '../../domain/model/TimeWindow'

describe('UpdateRegistration', () => {
  it('emits RegistrationUpdated with updated name', () => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    const slot = a.slots[0]
    slot.addRegistration('Alice')
    const regId = a.toJSON().slots[0].registrations[0].id

    const event = new UpdateRegistration().execute({ activity: a.toJSON(), slotId: slot.id, registrationId: regId, personName: 'Alice M.' })
    expect(event).toBeInstanceOf(RegistrationUpdated)
    expect(event.payload.slots[0].registrations[0].personName).toBe('Alice M.')
  })
})
