// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageTicketRepository } from './LocalStorageTicketRepository.js'
import { Ticket } from '../../domain/model/Ticket.js'

describe('LocalStorageTicketRepository', () => {
  let repo

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageTicketRepository()
  })

  it('saves and retrieves a ticket by id with correct status and lines', async () => {
    const ticket = Ticket.create()
    ticket.addLine('prod-1', 'Bière', 2.5, 2)
    await repo.save(ticket)

    const found = await repo.findById(ticket.id)
    expect(found.id).toBe(ticket.id)
    expect(found.status).toBe('open')
    expect(found.lines).toHaveLength(1)
    expect(found.lines[0].productName).toBe('Bière')
    expect(found.lines[0].quantity).toBe(2)
  })

  it('findByStatus returns only closed tickets', async () => {
    const open = Ticket.create()
    const closed = Ticket.create()
    closed.addLine('prod-1', 'Bière', 2.5, 1)
    closed.close('cash')

    await repo.save(open)
    await repo.save(closed)

    const results = await repo.findByStatus('closed')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe(closed.id)
    expect(results[0].status).toBe('closed')
  })

  it('returns all saved tickets', async () => {
    await repo.save(Ticket.create())
    await repo.save(Ticket.create())

    const all = await repo.findAll()
    expect(all).toHaveLength(2)
  })

  it('deletes a ticket so it is no longer findable', async () => {
    const ticket = Ticket.create()
    await repo.save(ticket)
    await repo.delete(ticket.id)

    expect(await repo.findById(ticket.id)).toBeNull()
  })

  it('returns null when ticket is not found', async () => {
    expect(await repo.findById('unknown')).toBeNull()
  })

  it('persists across repository instances', async () => {
    const ticket = Ticket.create()
    ticket.addLine('prod-1', 'Bière', 2.5, 1)
    await repo.save(ticket)
    const repo2 = new LocalStorageTicketRepository()
    const found = await repo2.findById(ticket.id)
    expect(found.lines).toHaveLength(1)
  })
})
