import { describe, it, expect } from 'vitest'
import { Volunteer } from './Volunteer.js'

describe('Volunteer', () => {
  it('creates a volunteer with a valid name', () => {
    const v = Volunteer.create('Alice')
    expect(v.name.value).toBe('Alice')
    expect(v.id).toBeDefined()
  })

  it('generates unique ids for each volunteer', () => {
    const a = Volunteer.create('Alice')
    const b = Volunteer.create('Bob')
    expect(a.id).not.toBe(b.id)
  })

  it('rejects an empty name', () => {
    expect(() => Volunteer.create('')).toThrow()
  })

  it('rejects a blank name', () => {
    expect(() => Volunteer.create('   ')).toThrow()
  })

  it('trims the name', () => {
    const v = Volunteer.create('  Alice  ')
    expect(v.name.value).toBe('Alice')
  })
})
