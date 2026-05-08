import { CreateProduct } from './application/usecases/CreateProduct.js'
import { WsClient } from '../client/WsClient.js'
import './adapters/ui/MioumProductForm.js'
import './adapters/ui/MioumProductList.js'
import './adapters/ui/MioumTicketView.js'
import './adapters/ui/MioumStatsView.js'
import './adapters/ui/MioumHistoryView.js'

const ws = new WsClient('ws://localhost:3000')

const productForm = document.querySelector('mioum-product-form')
const productList = document.querySelector('mioum-product-list')
const ticketView = document.querySelector('mioum-ticket-view')
const statsView = document.querySelector('mioum-stats-view')
const historyView = document.querySelector('mioum-history-view')
const offlineBanner = document.getElementById('offline-banner')

productForm.createProductUseCase = {
  execute: ({ name, price, category }) => {
    new CreateProduct().execute({ name, price, category })
    return { name, price, category }
  },
}

function toProductRepo(products) {
  return {
    findAll: () => Promise.resolve(products.map(p => ({
      id: p.id,
      name: { value: p.name },
      price: { value: p.price },
      category: p.category,
    }))),
  }
}

function computeStats(tickets) {
  const closed = tickets.filter(t => t.status === 'closed')
  const ticketCount = closed.length
  const totalRevenue = Math.round(closed.reduce((sum, t) => sum + (t.total ?? 0), 0) * 100) / 100
  const averageTicket = ticketCount > 0 ? Math.round((totalRevenue / ticketCount) * 100) / 100 : 0
  const breakdownMap = new Map()
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
    breakdown: [...breakdownMap.values()].map(e => ({ ...e, revenue: Math.round(e.revenue * 100) / 100 })),
  }
}

ws.onState('mioum', ({ products, tickets, currentTicket }) => {
  productList.refresh(toProductRepo(products))
  const enrichedTicket = currentTicket ? { ...currentTicket, isOpen: currentTicket.status === 'open' } : null
  ticketView.refresh(enrichedTicket, toProductRepo(products))
  statsView.refresh({ execute: () => Promise.resolve(computeStats(tickets)) })
  historyView.refresh({
    findAll: () => Promise.resolve(tickets.map(t => ({ ...t, isOpen: t.status === 'open' }))),
  })
  if (!currentTicket) ws.send('mioum', 'OpenTicket', {}).catch(() => {})
})

ws.onConnectionChange(({ connected, queueLength }) => {
  offlineBanner.hidden = connected
  offlineBanner.textContent = `Hors ligne — ${queueLength} action(s) en attente`
})

const dispatchError = msg => document.dispatchEvent(new CustomEvent('mioum-error', { detail: { message: msg } }))

document.addEventListener('product-created', e =>
  ws.send('mioum', 'CreateProduct', e.detail).catch(err => dispatchError(err.message)))

document.addEventListener('product-delete-requested', e =>
  ws.send('mioum', 'DeleteProduct', { productId: e.detail.productId }).catch(err => dispatchError(err.message)))

document.addEventListener('product-edit-requested', async e => {
  const { productId, name, price, category } = e.detail
  const newName = window.prompt('Nouveau nom du produit :', name)
  if (newName === null) return
  const newCategory = window.prompt('Catégorie :', category)
  if (newCategory === null) return
  const newPriceRaw = window.prompt('Nouveau prix (€) :', price)
  if (newPriceRaw === null) return
  const newPrice = parseFloat(newPriceRaw)
  if (isNaN(newPrice)) { dispatchError('Prix invalide.'); return }
  ws.send('mioum', 'UpdateProduct', { productId, name: newName, price: newPrice, category: newCategory })
    .catch(err => dispatchError(err.message))
})

document.addEventListener('line-add-requested', e =>
  ws.send('mioum', 'AddLineToTicket', { productId: e.detail.productId, quantity: e.detail.quantity ?? 1 })
    .catch(err => dispatchError(err.message)))

document.addEventListener('line-remove-requested', e =>
  ws.send('mioum', 'RemoveLineFromTicket', { lineId: e.detail.lineId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('line-decrement-requested', e =>
  ws.send('mioum', 'DecrementLineQuantity', { lineId: e.detail.lineId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('ticket-close-requested', e =>
  ws.send('mioum', 'CloseTicket', { paymentMethod: e.detail.paymentMethod ?? null })
    .catch(err => dispatchError(err.message)))

document.addEventListener('ticket-cancel-requested', () =>
  ws.send('mioum', 'CancelTicket', {}).catch(err => dispatchError(err.message)))

document.addEventListener('ticket-reopen-requested', e =>
  ws.send('mioum', 'ReopenTicket', { ticketId: e.detail.ticketId })
    .catch(err => dispatchError(err.message)))

document.addEventListener('mioum-error', e => {
  const alert = document.getElementById('mioum-alert')
  alert.textContent = e.detail.message
  alert.hidden = false
  setTimeout(() => { alert.hidden = true }, 4000)
})
