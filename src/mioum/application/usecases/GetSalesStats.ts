import { TicketRepository } from '../../ports/TicketRepository'
import { ProductId, TicketId, TicketLineId } from '../../../shared/types'

interface ClosedTicket {
  id: TicketId
  lines: { id: TicketLineId, productId: ProductId, productName: string, unitPrice: number, quantity: number, subtotal: number }[]
  status: 'closed'
  paymentMethod: string | null
  closedAt: number
  total: number
}

interface SalesBreakdownEntry {
  productId: ProductId
  productName: string
  quantity: number
  revenue: number
}

interface SalesStats {
  ticketCount: number
  totalRevenue: number
  averageTicket: number
  breakdown: SalesBreakdownEntry[]
}

export class GetSalesStats {
  #ticketRepo: TicketRepository

  constructor(ticketRepository: TicketRepository) {
    this.#ticketRepo = ticketRepository
  }

  async execute(): Promise<SalesStats> {
    const closedTickets = await this.#ticketRepo.findByStatus('closed')

    const ticketCount = closedTickets.length
    const totalRevenue = closedTickets.reduce((sum, t) => sum + t.total, 0)

    const breakdownMap: Map<ProductId, SalesBreakdownEntry> = new Map()
    for (const ticket of closedTickets as ClosedTicket[]) {
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
