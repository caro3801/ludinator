import { describe, it, expect } from 'vitest'
import { PaymentMethod } from './PaymentMethod.js'
import { ValidationError } from '../errors/ValidationError.js'

describe('PaymentMethod', () => {
  it('accepts "cash" and returns its value', () => {
    const m = new PaymentMethod('cash')
    expect(m.value).toBe('cash')
  })

  it('accepts "card" and returns its value', () => {
    const m = new PaymentMethod('card')
    expect(m.value).toBe('card')
  })

  it('accepts "other" and returns its value', () => {
    const m = new PaymentMethod('other')
    expect(m.value).toBe('other')
  })

  it('throws ValidationError for unknown string', () => {
    expect(() => new PaymentMethod('bitcoin')).toThrow(ValidationError)
  })

  it('throws ValidationError for empty string', () => {
    expect(() => new PaymentMethod('')).toThrow(ValidationError)
  })

  it('throws ValidationError for null', () => {
    expect(() => new PaymentMethod(null)).toThrow(ValidationError)
  })

  it('throws ValidationError for undefined', () => {
    expect(() => new PaymentMethod(undefined)).toThrow(ValidationError)
  })
})
