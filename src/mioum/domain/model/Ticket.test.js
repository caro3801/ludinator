import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Ticket } from './Ticket.js'
import { ValidationError } from '../errors/ValidationError.js'

describe('Ticket', () => {
  describe('create', () => {
    it('generates an id, status is open, lines empty, total 0', () => {
      const ticket = Ticket.create()
      expect(typeof ticket.id).toBe('string')
      expect(ticket.id.length).toBeGreaterThan(0)
      expect(ticket.status).toBe('open')
      expect(ticket.lines).toEqual([])
      expect(ticket.total).toBe(0)
      expect(ticket.paymentMethod).toBeNull()
      expect(ticket.closedAt).toBeNull()
      expect(ticket.isOpen).toBe(true)
    })
  })

  describe('addLine', () => {
    it('returns the new TicketLine and updates lines and total', () => {
      const ticket = Ticket.create()
      const line = ticket.addLine('prod-1', 'Crêpe', 2.50, 2)
      expect(ticket.lines).toHaveLength(1)
      expect(ticket.lines[0]).toBe(line)
      expect(line.productId).toBe('prod-1')
      expect(line.productName).toBe('Crêpe')
      expect(line.unitPrice).toBe(2.50)
      expect(line.quantity).toBe(2)
      expect(line.subtotal).toBe(5.00)
      expect(ticket.total).toBe(5.00)
    })

    it('throws ValidationError when ticket is closed', () => {
      const ticket = Ticket.create()
      ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
      ticket.close('cash')
      expect(() => ticket.addLine('prod-2', 'Jus', 1.50, 1)).toThrow(ValidationError)
      expect(() => ticket.addLine('prod-2', 'Jus', 1.50, 1)).toThrow('Ticket is not open')
    })

    it('throws ValidationError when ticket is cancelled', () => {
      const ticket = Ticket.create()
      ticket.cancel()
      expect(() => ticket.addLine('prod-1', 'Crêpe', 2.50, 1)).toThrow(ValidationError)
      expect(() => ticket.addLine('prod-1', 'Crêpe', 2.50, 1)).toThrow('Ticket is not open')
    })
  })

  describe('removeLine', () => {
    it('removes an existing line by id', () => {
      const ticket = Ticket.create()
      const line = ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
      ticket.removeLine(line.id)
      expect(ticket.lines).toHaveLength(0)
      expect(ticket.total).toBe(0)
    })

    it('silently ignores removal of a non-existent line id', () => {
      const ticket = Ticket.create()
      ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
      expect(() => ticket.removeLine('nonexistent-id')).not.toThrow()
      expect(ticket.lines).toHaveLength(1)
    })

    it('total reflects only the remaining line after removing one of two', () => {
      const ticket = Ticket.create()
      const line1 = ticket.addLine('prod-1', 'Crêpe', 2.50, 2)   // 5.00
      ticket.addLine('prod-2', 'Jus', 1.50, 1)                    // 1.50
      ticket.removeLine(line1.id)
      expect(ticket.lines).toHaveLength(1)
      expect(ticket.total).toBeCloseTo(1.50, 10)
    })

    it('throws ValidationError when ticket is closed', () => {
      const ticket = Ticket.create()
      const line = ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
      ticket.close('cash')
      expect(() => ticket.removeLine(line.id)).toThrow(ValidationError)
      expect(() => ticket.removeLine(line.id)).toThrow('Ticket is not open')
    })
  })

  describe('close', () => {
    it('sets status to closed, stores paymentMethod and sets closedAt', () => {
      const before = Date.now()
      const ticket = Ticket.create()
      ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
      ticket.close('cash')
      const after = Date.now()
      expect(ticket.status).toBe('closed')
      expect(ticket.paymentMethod).toBe('cash')
      expect(ticket.isOpen).toBe(false)
      expect(ticket.closedAt).toBeGreaterThanOrEqual(before)
      expect(ticket.closedAt).toBeLessThanOrEqual(after)
    })

    it('throws ValidationError when lines are empty', () => {
      const ticket = Ticket.create()
      expect(() => ticket.close('cash')).toThrow(ValidationError)
      expect(() => ticket.close('cash')).toThrow('Ticket has no lines')
    })

    it('throws ValidationError when ticket is already closed', () => {
      const ticket = Ticket.create()
      ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
      ticket.close('cash')
      expect(() => ticket.close('cash')).toThrow(ValidationError)
      expect(() => ticket.close('cash')).toThrow('Ticket is not open')
    })

    it('throws ValidationError when paymentMethod is invalid', () => {
      const ticket = Ticket.create()
      ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
      expect(() => ticket.close('invalid-method')).toThrow(ValidationError)
    })
  })

  describe('cancel', () => {
    it('sets status to cancelled', () => {
      const ticket = Ticket.create()
      ticket.cancel()
      expect(ticket.status).toBe('cancelled')
      expect(ticket.isOpen).toBe(false)
    })

    it('throws ValidationError when ticket is already closed', () => {
      const ticket = Ticket.create()
      ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
      ticket.close('cash')
      expect(() => ticket.cancel()).toThrow(ValidationError)
      expect(() => ticket.cancel()).toThrow('Ticket is not open')
    })

    it('throws ValidationError when ticket is already cancelled', () => {
      const ticket = Ticket.create()
      ticket.cancel()
      expect(() => ticket.cancel()).toThrow(ValidationError)
      expect(() => ticket.cancel()).toThrow('Ticket is not open')
    })
  })

  describe('total', () => {
    it('computes the sum correctly across multiple lines with different quantities', () => {
      const ticket = Ticket.create()
      ticket.addLine('prod-1', 'Crêpe', 2.50, 3)   // 7.50
      ticket.addLine('prod-2', 'Jus', 1.50, 2)      // 3.00
      ticket.addLine('prod-3', 'Café', 1.00, 1)     // 1.00
      expect(ticket.total).toBeCloseTo(11.50, 10)
    })
  })

  describe('toJSON / fromJSON', () => {
    it('round-trips preserving status, lines, paymentMethod, and closedAt', () => {
      const ticket = Ticket.create()
      ticket.addLine('prod-1', 'Crêpe', 2.50, 2)
      ticket.addLine('prod-2', 'Jus', 1.50, 1)
      ticket.close('card')

      const json = ticket.toJSON()
      expect(json.status).toBe('closed')
      expect(json.paymentMethod).toBe('card')
      expect(json.closedAt).toBe(ticket.closedAt)
      expect(json.lines).toHaveLength(2)

      const restored = Ticket.fromJSON(json)
      expect(restored.id).toBe(ticket.id)
      expect(restored.status).toBe('closed')
      expect(restored.paymentMethod).toBe('card')
      expect(restored.closedAt).toBe(ticket.closedAt)
      expect(restored.lines).toHaveLength(2)
      expect(restored.lines[0].productId).toBe('prod-1')
      expect(restored.lines[0].productName).toBe('Crêpe')
      expect(restored.lines[0].unitPrice).toBe(2.50)
      expect(restored.lines[0].quantity).toBe(2)
      expect(restored.lines[1].productId).toBe('prod-2')
      expect(restored.total).toBeCloseTo(6.50, 10)
    })

    it('round-trips an open ticket without paymentMethod or closedAt', () => {
      const ticket = Ticket.create()
      ticket.addLine('prod-1', 'Bière', 3.00, 1)
      const json = ticket.toJSON()
      const restored = Ticket.fromJSON(json)
      expect(restored.status).toBe('open')
      expect(restored.paymentMethod).toBeNull()
      expect(restored.closedAt).toBeNull()
      expect(restored.isOpen).toBe(true)
    })
  })
})

describe('TicketLine (via Ticket.addLine)', () => {
  it('throws ValidationError when quantity is less than 1', () => {
    const ticket = Ticket.create()
    expect(() => ticket.addLine('prod-1', 'Crêpe', 2.50, 0)).toThrow(ValidationError)
  })

  it('throws ValidationError when quantity is not an integer', () => {
    const ticket = Ticket.create()
    expect(() => ticket.addLine('prod-1', 'Crêpe', 2.50, 1.5)).toThrow(ValidationError)
  })

  it('throws ValidationError when unitPrice is negative', () => {
    const ticket = Ticket.create()
    expect(() => ticket.addLine('prod-1', 'Crêpe', -1, 1)).toThrow(ValidationError)
  })

  it('throws ValidationError when unitPrice is NaN', () => {
    const ticket = Ticket.create()
    expect(() => ticket.addLine('prod-1', 'Crêpe', NaN, 1)).toThrow(ValidationError)
  })

  it('throws ValidationError when unitPrice is a string', () => {
    const ticket = Ticket.create()
    expect(() => ticket.addLine('prod-1', 'Crêpe', 'abc', 1)).toThrow(ValidationError)
  })

  it('has a non-empty id string', () => {
    const ticket = Ticket.create()
    const line = ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
    expect(typeof line.id).toBe('string')
    expect(line.id.length).toBeGreaterThan(0)
  })

  it('toJSON returns a plain object with correct shape', () => {
    const ticket = Ticket.create()
    const line = ticket.addLine('prod-1', 'Crêpe', 2.50, 3)
    const json = line.toJSON()
    expect(json).toEqual({
      id: line.id,
      productId: 'prod-1',
      productName: 'Crêpe',
      unitPrice: 2.50,
      quantity: 3,
    })
  })
})
