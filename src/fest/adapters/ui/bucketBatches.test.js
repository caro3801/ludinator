import { describe, it, expect } from 'vitest'
import { bucketBatches } from './bucketBatches.js'

const makeAt = (h, m) => new Date(2024, 0, 1, h, m, 0).getTime()

describe('bucketBatches', () => {
  it('returns empty array when no batches', () => {
    expect(bucketBatches([], 30)).toEqual([])
  })

  it('puts a single batch into one bucket', () => {
    const batches = [{ timestamp: makeAt(10, 15), adults: 3, children: 2, families: 1 }]
    const result = bucketBatches(batches, 30)
    expect(result).toHaveLength(1)
    expect(result[0].adults).toBe(3)
    expect(result[0].children).toBe(2)
  })

  it('uses the bucket start time as label (HH:MM)', () => {
    const batches = [{ timestamp: makeAt(10, 15), adults: 2, children: 1, families: 0 }]
    const result = bucketBatches(batches, 30)
    expect(result[0].label).toBe('10:00')
  })

  it('sums adults and children separately within the same bucket', () => {
    const batches = [
      { timestamp: makeAt(10, 5), adults: 2, children: 1, families: 0 },
      { timestamp: makeAt(10, 20), adults: 1, children: 2, families: 0 },
    ]
    const result = bucketBatches(batches, 30)
    expect(result).toHaveLength(1)
    expect(result[0].adults).toBe(3)
    expect(result[0].children).toBe(3)
  })

  it('separates batches into different buckets', () => {
    const batches = [
      { timestamp: makeAt(10, 5), adults: 2, children: 1, families: 0 },
      { timestamp: makeAt(10, 40), adults: 3, children: 0, families: 0 },
    ]
    const result = bucketBatches(batches, 30)
    expect(result).toHaveLength(2)
    expect(result[0].adults).toBe(2)
    expect(result[1].adults).toBe(3)
  })

  it('sorts buckets chronologically', () => {
    const batches = [
      { timestamp: makeAt(10, 45), adults: 1, children: 0, families: 0 },
      { timestamp: makeAt(10, 5), adults: 2, children: 0, families: 0 },
    ]
    const result = bucketBatches(batches, 30)
    expect(result[0].label).toBe('10:00')
    expect(result[1].label).toBe('10:30')
  })

  it('respects a custom interval (15 min)', () => {
    const batches = [
      { timestamp: makeAt(10, 5), adults: 1, children: 0, families: 0 },
      { timestamp: makeAt(10, 20), adults: 1, children: 0, families: 0 },
    ]
    const result = bucketBatches(batches, 15)
    expect(result).toHaveLength(2)
    expect(result[0].label).toBe('10:00')
    expect(result[1].label).toBe('10:15')
  })

  it('does not count families', () => {
    const batches = [{ timestamp: makeAt(10, 0), adults: 2, children: 3, families: 5 }]
    const b = bucketBatches(batches, 30)[0]
    expect(b.adults).toBe(2)
    expect(b.children).toBe(3)
  })

  it('fills in empty buckets between first and last batch with zeros', () => {
    const batches = [
      { timestamp: makeAt(10, 0), adults: 2, children: 0, families: 0 },
      { timestamp: makeAt(11, 0), adults: 3, children: 0, families: 0 },
    ]
    const result = bucketBatches(batches, 30)
    expect(result).toHaveLength(3)
    expect(result[1].adults).toBe(0)
    expect(result[1].children).toBe(0)
    expect(result[1].label).toBe('10:30')
  })
})
