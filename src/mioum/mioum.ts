import { CreateProduct } from './application/usecases/CreateProduct'
import { UpdateProduct } from './application/usecases/UpdateProduct'
import { DeleteProduct } from './application/usecases/DeleteProduct'
import { OpenTicket } from './application/usecases/OpenTicket'
import { AddLineToTicket } from './application/usecases/AddLineToTicket'
import { RemoveLineFromTicket } from './application/usecases/RemoveLineFromTicket'
import { DecrementLineQuantity } from './application/usecases/DecrementLineQuantity'
import { CloseTicket } from './application/usecases/CloseTicket'
import { CancelTicket } from './application/usecases/CancelTicket'
import { ReopenTicket } from './application/usecases/ReopenTicket'
import { GetSalesStats } from './application/usecases/GetSalesStats'
import { WsClient } from '../client/WsClient'

// Import all UI components to register them
import './adapters/ui/MioumProductForm'
import './adapters/ui/MioumProductList'
import './adapters/ui/MioumTicketView'
import './adapters/ui/MioumStatsView'
import './adapters/ui/MioumHistoryView'

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const ws = new WsClient(`${wsProtocol}//${window.location.host}`)

// Get DOM elements with proper typing
const productForm = document.querySelector<HTMLElement & { createProductUseCase: unknown }>('mioum-product-form')
const productList = document.querySelector<HTMLElement & { refresh: (repo: unknown) => Promise<void> }>('mioum-product-list')
const ticketView = document.querySelector<HTMLElement & { refresh: (ticket: unknown, repo: unknown) => Promise<void> }>('mioum-ticket-view')
const statsView = document.querySelector<HTMLElement & { refresh: (useCase: unknown) => Promise<void> }>('mioum-stats-view')
const historyView = document.querySelector<HTMLElement & { refresh: (repo: unknown) => Promise<void> }>('mioum-history-view')
const offlineBanner = document.getElementById('offline-banner')

const dispatchError = (msg: string): void => {
  document.dispatchEvent(new CustomEvent('mioum-error', { detail: { message: msg } }))
}

// Configure use cases
if (productForm) {
  productForm.createProductUseCase = {
    execute: ({ name, price, category }: { name: string; price: number; category: string }) => {
      new CreateProduct().execute({ name, price, category })
      return { name, price, category }
    },
  }
}

// Helper to convert raw products to Product-like objects for UI
function toProductRepo(products: unknown[]): { findAll: () => Promise<Array<{ id: string; name: { value: string }; price: { value: number }; category: string }>> } {
  return {
    findAll: () => Promise.resolve(
      products.map((p: unknown) => ({
        id: (p as { id: string }).id,
        name: { value: (p as { name: string }).name },
        price: { value: (p as { price: number }).price },
        category: (p as { category: string }).category,
      }))
    ),
  }
}

// Helper to compute stats from raw ticket data
interface RawTicket {
  id: string
  lines: Array<{ productId: string; productName: string; unitPrice: number; quantity: number }>
  status: string
  total: number
  paymentMethod: string | null
  closedAt: number | null
}

function computeStats(tickets: RawTicket[]): {
  ticketCount: number
  totalRevenue: number
  averageTicket: number
  breakdown: Array<{ productName: string; quantity: number; revenue: number }>
} {
  const closed = tickets.filter((t) => t.status === 'closed')
  const ticketCount = closed.length
  const totalRevenue = Math.round(closed.reduce((sum, t) => sum + (t.total ?? 0), 0) * 100) / 100
  const averageTicket = ticketCount > 0 ? Math.round((totalRevenue / ticketCount) * 100) / 100 : 0
  const breakdownMap = new Map<string, { productName: string; quantity: number; revenue: number }>()
  
  for (const ticket of closed) {
    for (const line of ticket.lines) {
      const lineTotal = line.unitPrice * line.quantity
      const existing = breakdownMap.get(line.productId)
      if (existing) {
        existing.quantity += line.quantity
        existing.revenue += lineTotal
      } else {
        breakdownMap.set(line.productId, { productName: line.productName, quantity: line.quantity, revenue: lineTotal })
      }
    }
  }
  
  return {
    ticketCount,
    totalRevenue,
    averageTicket,
    breakdown: [...breakdownMap.values()].map((e) => ({ ...e, revenue: Math.round(e.revenue * 100) / 100 })),
  }
}

// Handle state updates from WebSocket
ws.onState('mioum', (data: unknown) => {
  const { products, tickets, currentTicket } = data as { products: unknown[]; tickets: RawTicket[]; currentTicket: RawTicket | null }
  if (productList) {
    productList.refresh(toProductRepo(products as unknown[]))
  }
  
  const enrichedTicket = currentTicket ? { ...currentTicket, isOpen: currentTicket.status === 'open' } : null
  
  if (ticketView) {
    ticketView.refresh(enrichedTicket as unknown, toProductRepo(products as unknown[]))
  }
  
  if (statsView) {
    statsView.refresh({ execute: () => Promise.resolve(computeStats(tickets)) })
  }
  
  if (historyView) {
    historyView.refresh({
      findAll: () => Promise.resolve(tickets.map((t) => ({ ...t, isOpen: t.status === 'open' }))),
    })
  }
  
  // Auto-open a ticket if none exists
  if (!currentTicket) {
    ws.send('mioum', 'OpenTicket', {}).catch(() => {})
  }
})

ws.onConnectionChange(({ connected, queueLength }: { connected: boolean; queueLength: number }) => {
  if (offlineBanner) {
    offlineBanner.hidden = connected
    offlineBanner.textContent = `Hors ligne — ${queueLength} action(s) en attente`
  }
})

// Event listeners
interface ProductCreatedDetail { name: string; price: number; category: string }
interface ProductDeleteRequestedDetail { productId: string }
interface ProductEditRequestedDetail { productId: string; name: string; price: number; category: string }
interface LineAddRequestedDetail { ticketId?: string; productId: string; quantity?: number }
interface LineRemoveRequestedDetail { ticketId?: string; lineId: string }
interface LineDecrementRequestedDetail { ticketId?: string; lineId: string }
interface TicketCloseRequestedDetail { ticketId?: string; paymentMethod: string }
interface TicketCancelRequestedDetail { ticketId?: string }
interface TicketReopenRequestedDetail { ticketId: string }

document.addEventListener('product-created', (e) => {
  const detail = (e as CustomEvent<ProductCreatedDetail>).detail
  ws.send('mioum', 'CreateProduct', detail).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('product-delete-requested', (e) => {
  const detail = (e as CustomEvent<ProductDeleteRequestedDetail>).detail
  ws.send('mioum', 'DeleteProduct', { productId: detail.productId }).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('product-edit-requested', async (e) => {
  const { productId, name, price, category } = (e as CustomEvent<ProductEditRequestedDetail>).detail
  const newName = window.prompt('Nouveau nom du produit :', name)
  if (newName === null) return
  const newCategory = window.prompt('Catégorie :', category)
  if (newCategory === null) return
  const newPriceRaw = window.prompt('Nouveau prix (€) :', price.toString())
  if (newPriceRaw === null) return
  const newPrice = parseFloat(newPriceRaw)
  if (isNaN(newPrice)) { dispatchError('Prix invalide.'); return }
  ws.send('mioum', 'UpdateProduct', { productId, name: newName, price: newPrice, category: newCategory })
    .catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('line-add-requested', (e) => {
  const detail = (e as CustomEvent<LineAddRequestedDetail>).detail
  ws.send('mioum', 'AddLineToTicket', { productId: detail.productId, quantity: detail.quantity ?? 1 })
    .catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('line-remove-requested', (e) => {
  const detail = (e as CustomEvent<LineRemoveRequestedDetail>).detail
  ws.send('mioum', 'RemoveLineFromTicket', { lineId: detail.lineId })
    .catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('line-decrement-requested', (e) => {
  const detail = (e as CustomEvent<LineDecrementRequestedDetail>).detail
  ws.send('mioum', 'DecrementLineQuantity', { lineId: detail.lineId })
    .catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('ticket-close-requested', (e) => {
  const detail = (e as CustomEvent<TicketCloseRequestedDetail>).detail
  ws.send('mioum', 'CloseTicket', { paymentMethod: detail.paymentMethod ?? null })
    .catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('ticket-cancel-requested', () => {
  ws.send('mioum', 'CancelTicket', {}).catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('ticket-reopen-requested', (e) => {
  const detail = (e as CustomEvent<TicketReopenRequestedDetail>).detail
  ws.send('mioum', 'ReopenTicket', { ticketId: detail.ticketId })
    .catch((err) => dispatchError((err as Error).message))
})

document.addEventListener('mioum-error', (e) => {
  const alert = document.getElementById('mioum-alert')
  if (alert) {
    const detail = (e as CustomEvent<{ message: string }>).detail
    alert.textContent = detail.message
    alert.hidden = false
    setTimeout(() => { alert.hidden = true }, 4000)
  }
})
