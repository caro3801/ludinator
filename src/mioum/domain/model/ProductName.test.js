import { describe, it, expect } from 'vitest'
import { ProductName } from './ProductName.js'
import { ValidationError } from '../errors/ValidationError.js'

describe('ProductName', () => {
  it('stores a valid string trimmed correctly', () => {
    const p = new ProductName('  Chips  ')
    expect(p.value).toBe('Chips')
  })

  it('stores a plain valid string as-is', () => {
    const p = new ProductName('Beer')
    expect(p.value).toBe('Beer')
  })

  it('throws ValidationError for empty string', () => {
    expect(() => new ProductName('')).toThrow(ValidationError)
  })

  it('throws ValidationError for whitespace-only string', () => {
    expect(() => new ProductName('   ')).toThrow(ValidationError)
  })

  it('throws ValidationError for null', () => {
    expect(() => new ProductName(null)).toThrow(ValidationError)
  })

  it('throws ValidationError for undefined', () => {
    expect(() => new ProductName(undefined)).toThrow(ValidationError)
  })
})
