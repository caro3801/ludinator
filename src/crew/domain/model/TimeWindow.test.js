import { describe, it, expect } from 'vitest'
import { TimeWindow } from './TimeWindow.js'

describe('TimeWindow', () => {
  it('creates a valid time window', () => {
    const w = new TimeWindow('saturday', '09:00', '12:00')
    expect(w.day).toBe('saturday')
    expect(w.startTime).toBe('09:00')
    expect(w.endTime).toBe('12:00')
  })

  it('rejects startTime equal to endTime', () => {
    expect(() => new TimeWindow('saturday', '09:00', '09:00')).toThrow()
  })

  it('rejects startTime after endTime', () => {
    expect(() => new TimeWindow('saturday', '12:00', '09:00')).toThrow()
  })

  describe('overlaps', () => {
    it('returns true for overlapping windows on the same day', () => {
      const a = new TimeWindow('saturday', '09:00', '12:00')
      const b = new TimeWindow('saturday', '11:00', '14:00')
      expect(a.overlaps(b)).toBe(true)
      expect(b.overlaps(a)).toBe(true)
    })

    it('returns true for a window contained inside another', () => {
      const a = new TimeWindow('saturday', '08:00', '18:00')
      const b = new TimeWindow('saturday', '10:00', '12:00')
      expect(a.overlaps(b)).toBe(true)
    })

    it('returns false for adjacent windows (touching, not overlapping)', () => {
      const a = new TimeWindow('saturday', '09:00', '12:00')
      const b = new TimeWindow('saturday', '12:00', '15:00')
      expect(a.overlaps(b)).toBe(false)
    })

    it('returns false for non-overlapping windows on the same day', () => {
      const a = new TimeWindow('saturday', '09:00', '11:00')
      const b = new TimeWindow('saturday', '13:00', '15:00')
      expect(a.overlaps(b)).toBe(false)
    })

    it('returns false for same times on different days', () => {
      const a = new TimeWindow('saturday', '09:00', '12:00')
      const b = new TimeWindow('sunday', '09:00', '12:00')
      expect(a.overlaps(b)).toBe(false)
    })
  })

  describe('durationHours', () => {
    it('returns whole hours', () => {
      expect(new TimeWindow('saturday', '09:00', '12:00').durationHours).toBe(3)
    })

    it('returns fractional hours', () => {
      expect(new TimeWindow('saturday', '09:30', '11:00').durationHours).toBe(1.5)
    })
  })
})
