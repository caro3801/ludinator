import { describe, it, expect } from 'vitest'
import { DeleteActivity } from './DeleteActivity.js'
import { ActivityDeleted } from '../../domain/events.js'

describe('DeleteActivity', () => {
  it('emits ActivityDeleted with correct activityId', () => {
    const event = new DeleteActivity().execute({ activityId: 'a-1' })
    expect(event).toBeInstanceOf(ActivityDeleted)
    expect(event.payload.activityId).toBe('a-1')
  })
})
