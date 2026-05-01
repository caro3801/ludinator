// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import './MioumHistoryView.js'

const makeTicket = (status, closedAt = null, lines = [], paymentMethod = null) => ({
  id: crypto.randomUUID(),
  status,
  lines,
  total: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
  isOpen: status === 'open',
  paymentMethod: paymentMethod ?? (status === 'closed' ? 'cash' : null),
  closedAt,
})

const repoWith = (tickets) => ({ findAll: async () => tickets })

describe('MioumHistoryView', () => {
  let el

  beforeEach(() => {
    el = document.createElement('mioum-history-view')
    document.body.appendChild(el)
  })

  it('renders empty state when no past tickets', async () => {
    await el.refresh(repoWith([]))
    expect(el.textContent).toContain('Aucun ticket dans l\'historique.')
  })

  it('filters out open tickets — only past tickets are shown', async () => {
    const open = makeTicket('open')
    const closed = makeTicket('closed', Date.now())
    await el.refresh(repoWith([open, closed]))
    expect(el.querySelectorAll('tbody tr')).toHaveLength(1)
  })

  it('shows closed ticket with Encaissé badge', async () => {
    const t = makeTicket('closed', Date.now())
    await el.refresh(repoWith([t]))
    expect(el.textContent).toContain('Encaissé')
  })

  it('shows closed ticket with Rouvrir button carrying data-ticket-id', async () => {
    const t = makeTicket('closed', Date.now())
    await el.refresh(repoWith([t]))
    const btn = el.querySelector('button[data-action="reopen-ticket"]')
    expect(btn).not.toBeNull()
    expect(btn.dataset.ticketId).toBe(t.id)
  })

  it('shows cancelled ticket with Annulé badge and no Rouvrir button', async () => {
    const t = makeTicket('cancelled')
    await el.refresh(repoWith([t]))
    expect(el.textContent).toContain('Annulé')
    expect(el.querySelector('button[data-action="reopen-ticket"]')).toBeNull()
  })

  it('dispatches ticket-reopen-requested with ticketId on Rouvrir click', async () => {
    const t = makeTicket('closed', Date.now())
    await el.refresh(repoWith([t]))

    const events = []
    el.addEventListener('ticket-reopen-requested', e => events.push(e.detail))
    el.querySelector('button[data-action="reopen-ticket"]').click()

    expect(events[0].ticketId).toBe(t.id)
  })

  it('sorts by closedAt descending — most recent ticket first', async () => {
    const older = makeTicket('closed', 1000)
    const newer = makeTicket('closed', 2000)
    await el.refresh(repoWith([older, newer]))
    const btns = el.querySelectorAll('button[data-action="reopen-ticket"]')
    expect(btns[0].dataset.ticketId).toBe(newer.id)
  })

  it('shows total with two decimal places', async () => {
    const t = makeTicket('closed', Date.now(), [], 'cash')
    await el.refresh(repoWith([t]))
    expect(el.textContent).toContain('0.00 €')
  })

  it('shows Espèces for cash and Carte bleue for card payment', async () => {
    const cash = makeTicket('closed', 1000, [], 'cash')
    const card = makeTicket('closed', 2000, [], 'card')
    await el.refresh(repoWith([cash, card]))
    expect(el.textContent).toContain('Espèces')
    expect(el.textContent).toContain('Carte bleue')
  })
})
