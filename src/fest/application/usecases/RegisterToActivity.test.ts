import { describe, it, expect } from 'vitest'
import { RegisterToActivity } from './RegisterToActivity'
import { RegistrationAdded } from '../../domain/events'
import { Activity } from '../../domain/model/Activity'
import { TimeWindow } from '../../domain/model/TimeWindow'

describe('RegisterToActivity', () => {
  const makeActivity = () => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    return a.toJSON()
  }

  it('emits RegistrationAdded with registration in slot', () => {
    const activity = makeActivity()
    const slotId = activity.slots[0].id
    const event = new RegisterToActivity().execute({ activity, slotId, personName: 'Alice' })
    expect(event).toBeInstanceOf(RegistrationAdded)
    expect(event.payload.slots[0].registrations).toHaveLength(1)
    expect(event.payload.slots[0].registrations[0].personName).toBe('Alice')
  })

  it('throws when slot not found', () => {
    const activity = makeActivity()
    expect(() => new RegisterToActivity().execute({ activity, slotId: 'bad', personName: 'Alice' })).toThrow()
  })

  it('throws when name is empty', () => {
    const activity = makeActivity()
    const slotId = activity.slots[0].id
    expect(() => new RegisterToActivity().execute({ activity, slotId, personName: '' })).toThrow()
  })
})
