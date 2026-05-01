import { describe, it, expect } from 'vitest'
import { Price } from './Price.js'
import { ValidationError } from '../errors/ValidationError.js'

describe('Price', () => {
  it('creates a valid price with a positive float', () => {
    const p = Price.create(2.50)
    expect(p.value).toBe(2.50)
  })

  it('creates a price of 0 (free item)', () => {
    const p = Price.create(0)
    expect(p.value).toBe(0)
  })

  it('creates a negative price (retour / remise)', () => {
    const p = Price.create(-1)
    expect(p.value).toBe(-1)
  })

  it('throws ValidationError for a non-numeric string', () => {
    expect(() => Price.create('abc')).toThrow(ValidationError)
  })

  it('throws ValidationError for null', () => {
    expect(() => Price.create(null)).toThrow(ValidationError)
  })
})
