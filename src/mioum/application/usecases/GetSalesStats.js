export class GetSalesStats {
  #ticketRepo

  constructor(ticketRepository) {
    this.#ticketRepo = ticketRepository
  }

  async execute() {
    const closedTickets = await this.#ticketRepo.findByStatus('closed')

    const ticketCount = closedTickets.length
    const totalRevenue = closedTickets.reduce((sum, t) => sum + t.total, 0)
    const averageTicket = ticketCount > 0 ? totalRevenue / ticketCount : 0

    const breakdownMap = new Map()
    for (const ticket of closedTickets) {
      for (const line of ticket.lines) {
        const existing = breakdownMap.get(line.productId)
        if (existing) {
          existing.quantity += line.quantity
          existing.revenue += line.subtotal
        } else {
          breakdownMap.set(line.productId, {
            productId: line.productId,
            productName: line.productName,
            quantity: line.quantity,
            revenue: line.subtotal,
          })
        }
      }
    }

    return {
      ticketCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageTicket: ticketCount > 0 ? Math.round((totalRevenue / ticketCount) * 100) / 100 : 0,
      breakdown: [...breakdownMap.values()].map(entry => ({
        ...entry,
        revenue: Math.round(entry.revenue * 100) / 100,
      })),
    }
  }
}
