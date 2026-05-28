import { describe, it, expect } from 'vitest'
import { DeleteActivity } from './DeleteActivity'
import { ActivityDeleted } from '../../domain/events'

describe('DeleteActivity', () => {
  it('emits ActivityDeleted with correct activityId', () => {
    const event = new DeleteActivity().execute({ activityId: 'a-1' })
    expect(event).toBeInstanceOf(ActivityDeleted)
    expect((event.payload as { activityId: string }).activityId).toBe('a-1')
  })
})
