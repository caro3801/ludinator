import { describe, it, expect } from 'vitest'
import { EntryLog } from './EntryLog.js'

describe('EntryLog', () => {
  describe('totals', () => {
    it('returns 0 when no sub-counters', () => {
      const log = EntryLog.create('edition-2024')
      expect(log.totalAdults).toBe(0)
      expect(log.total).toBe(0)
    })

    it('aggregates totalAdults across sub-counters', () => {
      const log = EntryLog.create('edition-2024')
      const sc1 = log.addSubCounter('Samedi')
      const sc2 = log.addSubCounter('Dimanche')
      sc1.addBatch({ adults: 3, children: 0, families: 0 })
      sc2.addBatch({ adults: 2, children: 0, families: 0 })
      expect(log.totalAdults).toBe(5)
    })

    it('aggregates totalChildren across sub-counters', () => {
      const log = EntryLog.create('edition-2024')
      const sc = log.addSubCounter('Samedi')
      sc.addBatch({ adults: 0, children: 4, families: 0 })
      expect(log.totalChildren).toBe(4)
    })

    it('aggregates totalFamilies across sub-counters', () => {
      const log = EntryLog.create('edition-2024')
      const sc = log.addSubCounter('Samedi')
      sc.addBatch({ adults: 2, children: 2, families: 1 })
      expect(log.totalFamilies).toBe(1)
    })

    it('total is adults + children', () => {
      const log = EntryLog.create('edition-2024')
      const sc = log.addSubCounter('Samedi')
      sc.addBatch({ adults: 3, children: 2, families: 1 })
      expect(log.total).toBe(5)
    })
  })

  describe('allBatches', () => {
    it('returns a flat list of all batches across sub-counters', () => {
      const log = EntryLog.create('edition-2024')
      const sc1 = log.addSubCounter('Samedi')
      const sc2 = log.addSubCounter('Dimanche')
      sc1.addBatch({ adults: 1, children: 0, families: 0 })
      sc2.addBatch({ adults: 2, children: 1, families: 0 })
      expect(log.allBatches).toHaveLength(2)
    })

    it('returns empty array when no sub-counters', () => {
      expect(EntryLog.create('edition-2024').allBatches).toHaveLength(0)
    })
  })

  it('serialises and deserialises correctly', () => {
    const log = EntryLog.create('edition-2024')
    const sc = log.addSubCounter('Samedi')
    sc.addBatch({ adults: 2, children: 1, families: 0 })
    const log2 = EntryLog.fromJSON(log.toJSON())
    expect(log2.totalAdults).toBe(2)
    expect(log2.subCounters).toHaveLength(1)
  })

  describe('subCounters', () => {
    it('starts with no sub-counters', () => {
      expect(EntryLog.create('edition-2024').subCounters).toHaveLength(0)
    })

    it('addSubCounter creates a named sub-counter and returns it', () => {
      const log = EntryLog.create('edition-2024')
      const sc = log.addSubCounter('Samedi')
      expect(sc.id).toBeDefined()
      expect(sc.label).toBe('Samedi')
      expect(log.subCounters).toHaveLength(1)
    })

    it('removeSubCounter removes by id', () => {
      const log = EntryLog.create('edition-2024')
      const sc = log.addSubCounter('Samedi')
      log.removeSubCounter(sc.id)
      expect(log.subCounters).toHaveLength(0)
    })

    it('findSubCounter returns the sub-counter by id', () => {
      const log = EntryLog.create('edition-2024')
      const sc = log.addSubCounter('Samedi')
      expect(log.findSubCounter(sc.id)).toBe(sc)
    })

    it('findSubCounter throws when not found', () => {
      expect(() => EntryLog.create('edition-2024').findSubCounter('nope')).toThrow()
    })

    it('sub-counter supports addBatch and totals', () => {
      const log = EntryLog.create('edition-2024')
      const sc = log.addSubCounter('Samedi')
      sc.addBatch({ adults: 3, children: 2, families: 1 })
      expect(sc.totalAdults).toBe(3)
      expect(sc.totalChildren).toBe(2)
      expect(sc.total).toBe(5)
    })

    it('sub-counter supports updateBatch', () => {
      const log = EntryLog.create('edition-2024')
      const sc = log.addSubCounter('Samedi')
      const batch = sc.addBatch({ adults: 1, children: 0, families: 0 })
      sc.updateBatch(batch.id, { adults: 5, children: 2, families: 0 })
      expect(sc.totalAdults).toBe(5)
    })

    it('sub-counter supports removeBatch', () => {
      const log = EntryLog.create('edition-2024')
      const sc = log.addSubCounter('Samedi')
      const batch = sc.addBatch({ adults: 1, children: 0, families: 0 })
      sc.removeBatch(batch.id)
      expect(sc.batches).toHaveLength(0)
    })

    it('serialises and deserialises sub-counters', () => {
      const log = EntryLog.create('edition-2024')
      const sc = log.addSubCounter('Samedi')
      sc.addBatch({ adults: 3, children: 1, families: 0 })
      const log2 = EntryLog.fromJSON(log.toJSON())
      expect(log2.subCounters).toHaveLength(1)
      expect(log2.subCounters[0].label).toBe('Samedi')
      expect(log2.subCounters[0].totalAdults).toBe(3)
    })
  })
})
