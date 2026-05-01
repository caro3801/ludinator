// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import './MioumTicketView.js'

const makeProduct = (name, price) => ({
  id: crypto.randomUUID(),
  name: { value: name },
  price: { value: price },
})
const repoWith = (products) => ({ findAll: async () => products })

const makeLine = (productName, unitPrice, quantity) => ({
  id: crypto.randomUUID(),
  productId: crypto.randomUUID(),
  productName,
  unitPrice,
  quantity,
  subtotal: unitPrice * quantity,
})

const makeTicket = (status = 'open', lines = []) => ({
  id: crypto.randomUUID(),
  status,
  lines,
  total: lines.reduce((s, l) => s + l.subtotal, 0),
  isOpen: status === 'open',
})

describe('MioumTicketView', () => {
  let el

  beforeEach(() => {
    el = document.createElement('mioum-ticket-view')
    document.body.appendChild(el)
  })

  it('renders empty state when no ticket', async () => {
    await el.refresh(null, repoWith([]))
    expect(el.textContent).toContain('Aucun ticket ouvert')
  })

  it('renders lines in ticket summary for open ticket', async () => {
    const line = makeLine('Café', 1.5, 2)
    const ticket = makeTicket('open', [line])
    await el.refresh(ticket, repoWith([]))
    expect(el.textContent).toContain('Café')
    expect(el.textContent).toContain('1.5')
    expect(el.textContent).toContain('2')
  })

  it('renders product buttons in grid for open ticket', async () => {
    const product = makeProduct('Café', 1.5)
    const ticket = makeTicket('open', [])
    await el.refresh(ticket, repoWith([product]))
    const btn = el.querySelector('button[data-action="add-product"]')
    expect(btn).not.toBeNull()
    expect(btn.dataset.productId).toBe(product.id)
    expect(btn.textContent).toContain('Café')
    expect(btn.textContent).toContain('1.50')
  })

  it('shows empty catalog message when no products', async () => {
    const ticket = makeTicket('open', [])
    await el.refresh(ticket, repoWith([]))
    expect(el.textContent).toContain('Aucun produit dans le catalogue.')
  })

  it('renders remove button per line with data attributes', async () => {
    const line = makeLine('Café', 1.5, 1)
    const ticket = makeTicket('open', [line])
    await el.refresh(ticket, repoWith([]))
    const btn = el.querySelector('button[data-action="remove-line"]')
    expect(btn).not.toBeNull()
    expect(btn.dataset.ticketId).toBe(ticket.id)
    expect(btn.dataset.lineId).toBe(line.id)
  })

  it('renders close-cash button with data-ticket-id', async () => {
    const ticket = makeTicket('open', [makeLine('Café', 1.5, 1)])
    await el.refresh(ticket, repoWith([]))
    const btn = el.querySelector('button[data-action="close-cash"]')
    expect(btn).not.toBeNull()
    expect(btn.dataset.ticketId).toBe(ticket.id)
  })

  it('renders close-card button with data-ticket-id', async () => {
    const ticket = makeTicket('open', [makeLine('Café', 1.5, 1)])
    await el.refresh(ticket, repoWith([]))
    const btn = el.querySelector('button[data-action="close-card"]')
    expect(btn).not.toBeNull()
    expect(btn.dataset.ticketId).toBe(ticket.id)
  })

  it('renders cancel button with data-ticket-id', async () => {
    const ticket = makeTicket('open', [])
    await el.refresh(ticket, repoWith([]))
    const btn = el.querySelector('button[data-action="cancel-ticket"]')
    expect(btn).not.toBeNull()
    expect(btn.dataset.ticketId).toBe(ticket.id)
  })

  it('dispatches line-add-requested with quantity 1 when product button clicked', async () => {
    const product = makeProduct('Café', 1.5)
    const ticket = makeTicket('open', [])
    await el.refresh(ticket, repoWith([product]))

    const events = []
    el.addEventListener('line-add-requested', e => events.push(e.detail))
    el.querySelector('button[data-action="add-product"]').click()

    expect(events[0].ticketId).toBe(ticket.id)
    expect(events[0].productId).toBe(product.id)
    expect(events[0].quantity).toBe(1)
  })

  it('dispatches line-remove-requested on remove click', async () => {
    const line = makeLine('Café', 1.5, 1)
    const ticket = makeTicket('open', [line])
    await el.refresh(ticket, repoWith([]))

    const events = []
    el.addEventListener('line-remove-requested', e => events.push(e.detail))
    el.querySelector('button[data-action="remove-line"]').click()

    expect(events[0].ticketId).toBe(ticket.id)
    expect(events[0].lineId).toBe(line.id)
  })

  it('dispatches ticket-close-requested with paymentMethod cash on close-cash click', async () => {
    const ticket = makeTicket('open', [makeLine('Café', 1.5, 1)])
    await el.refresh(ticket, repoWith([]))

    const events = []
    el.addEventListener('ticket-close-requested', e => events.push(e.detail))
    el.querySelector('button[data-action="close-cash"]').click()

    expect(events[0].ticketId).toBe(ticket.id)
    expect(events[0].paymentMethod).toBe('cash')
  })

  it('dispatches ticket-close-requested with paymentMethod card on close-card click', async () => {
    const ticket = makeTicket('open', [makeLine('Café', 1.5, 1)])
    await el.refresh(ticket, repoWith([]))

    const events = []
    el.addEventListener('ticket-close-requested', e => events.push(e.detail))
    el.querySelector('button[data-action="close-card"]').click()

    expect(events[0].ticketId).toBe(ticket.id)
    expect(events[0].paymentMethod).toBe('card')
  })

  it('dispatches ticket-cancel-requested on cancel click', async () => {
    const ticket = makeTicket('open', [])
    await el.refresh(ticket, repoWith([]))

    const events = []
    el.addEventListener('ticket-cancel-requested', e => events.push(e.detail))
    el.querySelector('button[data-action="cancel-ticket"]').click()

    expect(events[0].ticketId).toBe(ticket.id)
  })

  it('shows closed ticket as read-only with status badge', async () => {
    const line = makeLine('Café', 1.5, 2)
    const ticket = makeTicket('closed', [line])
    await el.refresh(ticket, repoWith([]))
    expect(el.textContent).toContain('Café')
    expect(el.textContent).toContain('3')
    expect(el.querySelector('button[data-action="close-cash"]')).toBeNull()
    expect(el.querySelector('button[data-action="close-card"]')).toBeNull()
    expect(el.querySelector('button[data-action="cancel-ticket"]')).toBeNull()
    expect(el.querySelector('[data-status]')).not.toBeNull()
  })

  it('shows cancelled ticket as read-only with status badge', async () => {
    const ticket = makeTicket('cancelled', [])
    await el.refresh(ticket, repoWith([]))
    expect(el.querySelector('button[data-action="close-cash"]')).toBeNull()
    expect(el.querySelector('[data-status]')).not.toBeNull()
  })
})
