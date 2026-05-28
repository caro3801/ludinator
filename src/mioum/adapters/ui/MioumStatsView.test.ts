// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MioumStatsView } from './MioumStatsView'
import './MioumStatsView'

interface StatsBreakdown {
  productName: string
  quantity: number
  revenue: number
}

interface SalesStats {
  ticketCount: number
  totalRevenue: number
  averageTicket: number
  breakdown: StatsBreakdown[]
}

const makeStats = (overrides: Partial<SalesStats> = {}): SalesStats => ({
  ticketCount: 3,
  totalRevenue: 15.5,
  averageTicket: 5.17,
  breakdown: [
    { productName: 'Café', quantity: 5, revenue: 7.5 },
    { productName: 'Eau', quantity: 3, revenue: 3 },
  ],
  ...overrides,
})

const makeUseCase = (stats: SalesStats) => ({ execute: vi.fn().mockResolvedValue(stats) })

describe('MioumStatsView', () => {
  let el: MioumStatsView

  beforeEach(() => {
    el = document.createElement('mioum-stats-view') as MioumStatsView
    document.body.appendChild(el)
  })

  it('renders empty state when ticketCount is 0', async () => {
    await el.refresh(makeUseCase(makeStats({ ticketCount: 0, totalRevenue: 0, averageTicket: 0, breakdown: [] })))
    expect(el.textContent).toContain('Aucune vente enregistrée')
  })

  it('renders ticket count', async () => {
    await el.refresh(makeUseCase(makeStats()))
    expect(el.textContent).toContain('3')
  })

  it('renders total revenue in euros', async () => {
    await el.refresh(makeUseCase(makeStats()))
    expect(el.textContent).toContain('15.5')
    expect(el.textContent).toContain('€')
  })

  it('renders average ticket in euros', async () => {
    await el.refresh(makeUseCase(makeStats()))
    expect(el.textContent).toContain('5.17')
    expect(el.textContent).toContain('€')
  })

  it('renders a row per breakdown entry', async () => {
    await el.refresh(makeUseCase(makeStats()))
    expect(el.querySelectorAll<HTMLTableRowElement>('tbody tr')).toHaveLength(2)
  })

  it('renders product name in breakdown', async () => {
    await el.refresh(makeUseCase(makeStats()))
    expect(el.textContent).toContain('Café')
    expect(el.textContent).toContain('Eau')
  })

  it('renders quantity and revenue per product', async () => {
    await el.refresh(makeUseCase(makeStats()))
    expect(el.textContent).toContain('7.5')
    expect(el.textContent).toContain('3')
  })

  it('calls the use case execute method', async () => {
    const useCase = makeUseCase(makeStats())
    await el.refresh(useCase)
    expect(useCase.execute).toHaveBeenCalledOnce()
  })
})
