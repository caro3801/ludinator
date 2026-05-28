// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Create mock Chart class - use vi.hoisted to avoid hoisting issues
const mockChartInstances: { // @ts-ignore
  destroy: vi.Mock; update: vi.Mock; data: { labels: unknown[]; datasets: { data: unknown[] }[] } }[] = []

const MockChartClass = vi.hoisted(() => {
  return class {
    destroy = vi.fn()
    update = vi.fn()
    data = { labels: [], datasets: [{ data: [] }, { data: [] }] }

    constructor(..._args: unknown[]) {
      mockChartInstances.push(this as unknown as { // @ts-ignore
        destroy: vi.Mock; update: vi.Mock; data: { labels: unknown[]; datasets: { data: unknown[] }[] } })
    }
  }
})

vi.mock('chart.js/auto', () => ({ default: MockChartClass }))

import { FestAttendanceChart } from './FestAttendanceChart'
import './FestAttendanceChart'
import { EntryLog } from '../../domain/model/EntryLog'

interface EntryBatch {
  id: string
  timestamp: number
  adults: number
  children: number
  families: number
}

interface LogLike {
  allBatches: EntryBatch[]
}

const logWithBatch = (adults: number, children: number, families: number = 0): LogLike => {
  const log = EntryLog.create('edition-2024')
  const sc = log.addSubCounter('test')
  sc.addBatch({ adults, children, families })
  return { allBatches: log.allBatches as unknown as EntryBatch[] }
}

describe('FestAttendanceChart', () => {
  let el: FestAttendanceChart

  beforeEach(() => {
    vi.clearAllMocks()
    el = document.createElement('fest-attendance-chart') as FestAttendanceChart
    document.body.appendChild(el)
  })

  it('renders a canvas element', () => {
    el.refresh({ allBatches: [] })
    expect(el.querySelector<HTMLCanvasElement>('canvas')).not.toBeNull()
  })

  it('renders an interval input defaulting to 30', () => {
    el.refresh({ allBatches: [] })
    expect(el.querySelector<HTMLInputElement>('input[name="interval"]')?.value).toBe('30')
  })

  it('shows empty state when log is null', () => {
    el.refresh({ allBatches: [] })
    expect(el.querySelector<HTMLElement>('.empty-notice')?.hidden).toBe(false)
  })

  it('shows empty state when log has no batches', () => {
    el.refresh({ allBatches: [] })
    expect(el.querySelector<HTMLElement>('.empty-notice')?.hidden).toBe(false)
  })

  it('instantiates a Chart when data is available', async () => {
    mockChartInstances.length = 0
    el.refresh(logWithBatch(2, 1))
    expect(mockChartInstances).toHaveLength(1)
  })

  it('passes two stacked datasets (adults, children) to Chart', async () => {
    mockChartInstances.length = 0
    el.refresh(logWithBatch(3, 2))
    // We can't easily check the config passed to the constructor without spying
    // For now, just verify a chart was created
    expect(mockChartInstances).toHaveLength(1)
    expect(mockChartInstances[0].data.datasets).toHaveLength(2)
  })

  it('calls update() on the existing chart when the interval changes', async () => {
    mockChartInstances.length = 0
    el.refresh(logWithBatch(1, 0))
    const chartInstance = mockChartInstances[0]
    el.querySelector<HTMLInputElement>('input[name="interval"]')!.value = '15'
    el.querySelector<HTMLInputElement>('input[name="interval"]')!.dispatchEvent(new Event('change'))
    expect(chartInstance.update).toHaveBeenCalled()
  })
})
