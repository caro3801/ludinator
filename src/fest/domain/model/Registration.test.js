import { describe, it, expect } from 'vitest'
import { Registration } from './Registration.js'

describe('Registration', () => {
  it('creates a registration with a name', () => {
    const r = Registration.create('s-1', 'Alice')
    expect(r.id).toBeDefined()
    expect(r.slotId).toBe('s-1')
    expect(r.personName).toBe('Alice')
  })

  it('trims the name', () => {
    expect(Registration.create('s-1', '  Bob  ').personName).toBe('Bob')
  })

  it('rejects an empty name', () => {
    expect(() => Registration.create('s-1', '')).toThrow()
    expect(() => Registration.create('s-1', '   ')).toThrow()
  })

  it('updateName changes the name', () => {
    const r = Registration.create('s-1', 'Alice')
    r.updateName('Alice M.')
    expect(r.personName).toBe('Alice M.')
  })

  it('updateName rejects an empty name', () => {
    const r = Registration.create('s-1', 'Alice')
    expect(() => r.updateName('')).toThrow()
  })

  it('is not waitlisted by default', () => {
    expect(Registration.create('s-1', 'Alice').waitlisted).toBe(false)
  })

  it('can be created as waitlisted', () => {
    expect(Registration.create('s-1', 'Alice', { waitlisted: true }).waitlisted).toBe(true)
  })

  it('serialises and deserialises correctly including waitlisted flag', () => {
    const r = Registration.create('s-1', 'Alice', { waitlisted: true })
    const r2 = Registration.fromJSON(r.toJSON())
    expect(r2.id).toBe(r.id)
    expect(r2.personName).toBe('Alice')
    expect(r2.waitlisted).toBe(true)
  })
})
