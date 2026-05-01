import { describe, it, expect } from 'vitest'
import { Product } from './Product.js'
import { ProductName } from './ProductName.js'
import { Price } from './Price.js'
import { ValidationError } from '../errors/ValidationError.js'

describe('Product', () => {
  describe('create', () => {
    it('generates an id, sets name and price from raw values', () => {
      const product = Product.create('Crêpe', 2.50)
      expect(typeof product.id).toBe('string')
      expect(product.id.length).toBeGreaterThan(0)
      expect(product.name).toBeInstanceOf(ProductName)
      expect(product.name.value).toBe('Crêpe')
      expect(product.price).toBeInstanceOf(Price)
      expect(product.price.value).toBe(2.50)
    })

    it('throws ValidationError when name is empty', () => {
      expect(() => Product.create('', 2.50)).toThrow(ValidationError)
    })

    it('throws ValidationError when price is negative', () => {
      expect(() => Product.create('Crêpe', -1)).toThrow(ValidationError)
    })
  })

  describe('update', () => {
    it('updates name only when only name is provided', () => {
      const product = Product.create('Crêpe', 2.50)
      const originalPrice = product.price.value
      product.update({ name: 'Galette' })
      expect(product.name.value).toBe('Galette')
      expect(product.price.value).toBe(originalPrice)
    })

    it('updates price only when only price is provided', () => {
      const product = Product.create('Crêpe', 2.50)
      const originalName = product.name.value
      product.update({ price: 3.00 })
      expect(product.price.value).toBe(3.00)
      expect(product.name.value).toBe(originalName)
    })

    it('throws ValidationError when update sets an empty name', () => {
      const product = Product.create('Crêpe', 2.50)
      expect(() => product.update({ name: '', price: 0 })).toThrow(ValidationError)
    })

    it('updates both name and price when both provided', () => {
      const product = Product.create('Crêpe', 2.50)
      product.update({ name: 'Galette', price: 3.00 })
      expect(product.name.value).toBe('Galette')
      expect(product.price.value).toBe(3.00)
    })

    it('does not mutate name when price update fails', () => {
      const product = Product.create('Crêpe', 2.50)
      expect(() => product.update({ name: 'Galette', price: -1 })).toThrow(ValidationError)
      expect(product.name.value).toBe('Crêpe')
    })
  })

  describe('toJSON', () => {
    it('returns a plain object with id, name (string), price (number)', () => {
      const product = Product.create('Crêpe', 2.50)
      const json = product.toJSON()
      expect(json).toEqual({
        id: product.id,
        name: 'Crêpe',
        price: 2.50,
      })
    })
  })

  describe('fromJSON', () => {
    it('round-trips through toJSON preserving id, name and price', () => {
      const original = Product.create('Crêpe', 2.50)
      const json = original.toJSON()
      const restored = Product.fromJSON(json)
      expect(restored.id).toBe(original.id)
      expect(restored.name.value).toBe(original.name.value)
      expect(restored.price.value).toBe(original.price.value)
    })
  })
})
