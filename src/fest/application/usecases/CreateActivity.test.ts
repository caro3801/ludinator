import { describe, it, expect } from 'vitest'
import { CreateActivity } from './CreateActivity'
import { ActivityCreated } from '../../domain/events'

describe('CreateActivity', () => {
  it('emits ActivityCreated with correct name', () => {
    const event = new CreateActivity().execute({ name: 'Escape Game' })
    expect(event).toBeInstanceOf(ActivityCreated)
    expect(event.payload.name).toBe('Escape Game')
  })

  it('stores an optional location', () => {
    const event = new CreateActivity().execute({ name: 'Quiz', location: 'Salle B' })
    expect(event.payload.location).toBe('Salle B')
  })

  it('throws on empty name', () => {
    expect(() => new CreateActivity().execute({ name: '' })).toThrow()
  })
})
