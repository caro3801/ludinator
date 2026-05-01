// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(function() {
    this.destroy = vi.fn()
    this.data = { labels: [], datasets: [{ data: [] }, { data: [] }] }
    this.update = vi.fn()
  }),
}))

import './FestAttendanceChart.js'
import { EntryLog } from '../../domain/model/EntryLog.js'

const logWithBatch = (adults, children, families = 0) => {
  const log = EntryLog.create('edition-2024')
  const sc = log.addSubCounter('test')
  sc.addBatch({ adults, children, families })
  return log
}

describe('FestAttendanceChart', () => {
  let el

  beforeEach(async () => {
    const { default: Chart } = await import('chart.js/auto')
    Chart.mockClear()
    el = document.createElement('fest-attendance-chart')
    document.body.appendChild(el)
  })

  it('renders a canvas element', () => {
    el.refresh(null)
    expect(el.querySelector('canvas')).not.toBeNull()
  })

  it('renders an interval input defaulting to 30', () => {
    el.refresh(null)
    expect(el.querySelector('input[name="interval"]').value).toBe('30')
  })

  it('shows empty state when log is null', () => {
    el.refresh(null)
    expect(el.querySelector('.empty-notice').hidden).toBe(false)
  })

  it('shows empty state when log has no batches', () => {
    el.refresh(EntryLog.create('edition-2024'))
    expect(el.querySelector('.empty-notice').hidden).toBe(false)
  })

  it('instantiates a Chart when data is available', async () => {
    const { default: Chart } = await import('chart.js/auto')
    el.refresh(logWithBatch(2, 1))
    expect(Chart).toHaveBeenCalledOnce()
  })

  it('passes two stacked datasets (adults, children) to Chart', async () => {
    const { default: Chart } = await import('chart.js/auto')
    el.refresh(logWithBatch(3, 2))
    const config = Chart.mock.calls[0][1]
    expect(config.data.datasets).toHaveLength(2)
    expect(config.data.datasets[0].data[0]).toBe(3) // adults
    expect(config.data.datasets[1].data[0]).toBe(2) // children
    expect(config.options.scales.x.stacked).toBe(true)
    expect(config.options.scales.y.stacked).toBe(true)
  })

  it('calls update() on the existing chart when the interval changes', async () => {
    const { default: Chart } = await import('chart.js/auto')
    el.refresh(logWithBatch(1, 0))
    const instance = Chart.mock.instances[0]
    el.querySelector('input[name="interval"]').value = '15'
    el.querySelector('input[name="interval"]').dispatchEvent(new Event('change'))
    expect(instance.update).toHaveBeenCalled()
  })
})
