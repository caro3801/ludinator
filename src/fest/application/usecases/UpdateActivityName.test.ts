import { describe, it, expect } from 'vitest'
import { UpdateActivityName } from './UpdateActivityName'
import { ActivityNameUpdated } from '../../domain/events'
import { Activity } from '../../domain/model/Activity'

describe('UpdateActivityName', () => {
  it('emits ActivityNameUpdated with new name', () => {
    const activity = Activity.create('Escape Game').toJSON() as { id: string; name: string; location: string | null; slots: unknown[] }
    const event = new UpdateActivityName().execute({ activity, name: 'Super Escape' })
    expect(event).toBeInstanceOf(ActivityNameUpdated)
    expect((event.payload as { name: string }).name).toBe('Super Escape')
  })

  it('throws on empty name', () => {
    const activity = Activity.create('Escape Game').toJSON() as { id: string; name: string; location: string | null; slots: unknown[] }
    expect(() => new UpdateActivityName().execute({ activity, name: '' })).toThrow()
  })
})
