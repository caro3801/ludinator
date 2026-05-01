import { describe, it, expect, beforeEach } from 'vitest'
import { GetSalesStats } from './GetSalesStats.js'
import { InMemoryTicketRepository } from '../../adapters/storage/InMemoryTicketRepository.js'
import { Ticket } from '../../domain/model/Ticket.js'

describe('GetSalesStats', () => {
  let ticketRepo, useCase

  beforeEach(() => {
    ticketRepo = new InMemoryTicketRepository()
    useCase = new GetSalesStats(ticketRepo)
  })

  function makeClosedTicket(lines) {
    const ticket = Ticket.create()
    for (const { productId, productName, unitPrice, quantity } of lines) {
      ticket.addLine(productId, productName, unitPrice, quantity)
    }
    ticket.close(null)
    return ticket
  }

  it('returns zero stats when there are no tickets', async () => {
    const stats = await useCase.execute()
    expect(stats).toEqual({ ticketCount: 0, totalRevenue: 0, averageTicket: 0, breakdown: [] })
  })

  it('returns correct stats for one closed ticket with one line', async () => {
    const ticket = makeClosedTicket([{ productId: 'p1', productName: 'Café', unitPrice: 1.50, quantity: 2 }])
    await ticketRepo.save(ticket)

    const stats = await useCase.execute()

    expect(stats.ticketCount).toBe(1)
    expect(stats.totalRevenue).toBe(3.00)
    expect(stats.averageTicket).toBe(3.00)
    expect(stats.breakdown).toHaveLength(1)
    expect(stats.breakdown[0]).toMatchObject({ productId: 'p1', productName: 'Café', quantity: 2, revenue: 3.00 })
  })

  it('computes correct stats for multiple closed tickets', async () => {
    const t1 = makeClosedTicket([{ productId: 'p1', productName: 'Café', unitPrice: 1.50, quantity: 1 }])
    const t2 = makeClosedTicket([{ productId: 'p2', productName: 'Bière', unitPrice: 3.00, quantity: 2 }])
    await ticketRepo.save(t1)
    await ticketRepo.save(t2)

    const stats = await useCase.execute()

    expect(stats.ticketCount).toBe(2)
    expect(stats.totalRevenue).toBe(7.50)
    expect(stats.averageTicket).toBe(3.75)
    expect(stats.breakdown).toHaveLength(2)
  })

  it('ignores open and cancelled tickets', async () => {
    const open = Ticket.create()
    open.addLine('p1', 'Café', 1.50, 1)
    await ticketRepo.save(open)

    const cancelled = Ticket.create()
    cancelled.addLine('p2', 'Bière', 3.00, 1)
    cancelled.cancel()
    await ticketRepo.save(cancelled)

    const closed = makeClosedTicket([{ productId: 'p3', productName: 'Eau', unitPrice: 0.50, quantity: 1 }])
    await ticketRepo.save(closed)

    const stats = await useCase.execute()

    expect(stats.ticketCount).toBe(1)
    expect(stats.totalRevenue).toBe(0.50)
    expect(stats.averageTicket).toBe(0.50)
    expect(stats.breakdown).toHaveLength(1)
    expect(stats.breakdown[0].productId).toBe('p3')
  })

  it('aggregates same product across multiple tickets in breakdown', async () => {
    const t1 = makeClosedTicket([{ productId: 'p1', productName: 'Café', unitPrice: 1.50, quantity: 2 }])
    const t2 = makeClosedTicket([{ productId: 'p1', productName: 'Café', unitPrice: 1.50, quantity: 3 }])
    await ticketRepo.save(t1)
    await ticketRepo.save(t2)

    const stats = await useCase.execute()

    expect(stats.breakdown).toHaveLength(1)
    expect(stats.breakdown[0]).toMatchObject({
      productId: 'p1',
      productName: 'Café',
      quantity: 5,
      revenue: 7.50,
    })
  })

  it('creates separate breakdown entries for different products', async () => {
    const ticket = makeClosedTicket([
      { productId: 'p1', productName: 'Café', unitPrice: 1.50, quantity: 1 },
      { productId: 'p2', productName: 'Bière', unitPrice: 3.00, quantity: 2 },
    ])
    await ticketRepo.save(ticket)

    const stats = await useCase.execute()

    expect(stats.breakdown).toHaveLength(2)
    const productIds = stats.breakdown.map(b => b.productId)
    expect(productIds).toContain('p1')
    expect(productIds).toContain('p2')
  })
})
