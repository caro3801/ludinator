// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
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

const mockChart = {
  instances: [] as { destroy: () => void; data: unknown; update: () => void }[],
  mockClear: vi.fn(),
  mock: {
    calls: [] as unknown[],
    instances: [] as unknown[],
  },
}

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation((...args: unknown[]) => {
    mockChart.mock.calls.push(args)
    const instance = {
      destroy: vi.fn(),
      data: { labels: [], datasets: [{ data: [] }, { data: [] }] },
      update: vi.fn(),
    }
    mockChart.mock.instances.push(instance)
    mockChart.instances.push(instance)
    return instance
  }),
}))

const logWithBatch = (adults: number, children: number, families: number = 0): LogLike => {
  const log = EntryLog.create('edition-2024')
  const sc = log.addSubCounter('test')
  sc.addBatch({ adults, children, families })
  return { allBatches: log.allBatches as unknown as EntryBatch[] }
}

describe('FestAttendanceChart', () => {
  let el: FestAttendanceChart

  beforeEach(async () => {
    mockChart.mockClear()
    mockChart.mock.calls = []
    mockChart.mock.instances = []
    mockChart.instances = []
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
    el.refresh(logWithBatch(2, 1))
    expect(mockChart.mock.calls).toHaveLength(1)
  })

  it('passes two stacked datasets (adults, children) to Chart', async () => {
    el.refresh(logWithBatch(3, 2))
    // @ts-ignore
    const config = mockChart.mock.calls[0][1] as { data: { datasets: { data: unknown[] }[] }; options: { scales: { x: { stacked: boolean }; y: { stacked: boolean } } } }
    expect(config.data.datasets).toHaveLength(2)
    expect(config.data.datasets[0].data[0]).toBe(3)
    expect(config.data.datasets[1].data[0]).toBe(2)
    expect(config.options.scales.x.stacked).toBe(true)
    expect(config.options.scales.y.stacked).toBe(true)
  })

  it('calls update() on the existing chart when the interval changes', async () => {
    el.refresh(logWithBatch(1, 0))
    const instance = mockChart.instances[0] as { update: () => void }
    el.querySelector<HTMLInputElement>('input[name="interval"]')!.value = '15'
    el.querySelector<HTMLInputElement>('input[name="interval"]')?.dispatchEvent(new Event('change'))
    expect(instance.update).toHaveBeenCalled()
  })
})
