import { describe, it, expect } from 'vitest'
import { ActivityName } from './ActivityName.js'

describe('ActivityName', () => {
  it('creates a valid name', () => {
    const n = new ActivityName('Escape Game')
    expect(n.value).toBe('Escape Game')
  })

  it('trims surrounding whitespace', () => {
    expect(new ActivityName('  Quiz  ').value).toBe('Quiz')
  })

  it('rejects an empty string', () => {
    expect(() => new ActivityName('')).toThrow()
  })

  it('rejects a blank string', () => {
    expect(() => new ActivityName('   ')).toThrow()
  })
})
