import { describe, it, expect } from 'vitest'
import { CancelRegistration } from './CancelRegistration'
import { RegistrationCancelled } from '../../domain/events'
import { Activity } from '../../domain/model/Activity'
import { TimeWindow } from '../../domain/model/TimeWindow'

describe('CancelRegistration', () => {
  it('emits RegistrationCancelled with registration removed', () => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    const slot = a.slots[0]
    slot.addRegistration('Alice')
    const regId = a.toJSON().slots[0].registrations[0].id

    const event = new CancelRegistration().execute({ activity: a.toJSON(), slotId: slot.id, registrationId: regId })
    expect(event).toBeInstanceOf(RegistrationCancelled)
    expect(event.payload.slots[0].registrations).toHaveLength(0)
  })
})
