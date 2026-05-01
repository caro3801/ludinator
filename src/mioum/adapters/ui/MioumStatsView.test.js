// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './MioumStatsView.js'

const makeStats = (overrides = {}) => ({
  ticketCount: 3,
  totalRevenue: 15.5,
  averageTicket: 5.17,
  breakdown: [
    { productId: '1', productName: 'Café', quantity: 5, revenue: 7.5 },
    { productId: '2', productName: 'Eau', quantity: 3, revenue: 3 },
  ],
  ...overrides,
})

const makeUseCase = (stats) => ({ execute: vi.fn().mockResolvedValue(stats) })

describe('MioumStatsView', () => {
  let el

  beforeEach(() => {
    el = document.createElement('mioum-stats-view')
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
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2)
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
