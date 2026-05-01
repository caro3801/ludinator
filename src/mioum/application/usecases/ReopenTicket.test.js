import { describe, it, expect, beforeEach } from 'vitest'
import { ReopenTicket } from './ReopenTicket.js'
import { OpenTicket } from './OpenTicket.js'
import { InMemoryTicketRepository } from '../../adapters/storage/InMemoryTicketRepository.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'

describe('ReopenTicket', () => {
  let ticketRepo, useCase, openTicket

  beforeEach(() => {
    ticketRepo = new InMemoryTicketRepository()
    useCase = new ReopenTicket(ticketRepo)
    openTicket = new OpenTicket(ticketRepo)
  })

  it('reopens a closed ticket — status becomes open, paymentMethod and closedAt are null', async () => {
    const ticket = await openTicket.execute()
    ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
    ticket.close('cash')
    await ticketRepo.save(ticket)

    const reopened = await useCase.execute({ ticketId: ticket.id })
    expect(reopened.status).toBe('open')
    expect(reopened.isOpen).toBe(true)
    expect(reopened.paymentMethod).toBeNull()
    expect(reopened.closedAt).toBeNull()
    expect((await ticketRepo.findById(ticket.id)).status).toBe('open')
  })

  it('throws ValidationError when ticket is open', async () => {
    const ticket = await openTicket.execute()
    await expect(useCase.execute({ ticketId: ticket.id })).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError when ticket is cancelled', async () => {
    const ticket = await openTicket.execute()
    ticket.cancel()
    await ticketRepo.save(ticket)
    await expect(useCase.execute({ ticketId: ticket.id })).rejects.toThrow(ValidationError)
  })

  it('throws when ticketId is unknown', async () => {
    await expect(useCase.execute({ ticketId: 'nonexistent' })).rejects.toThrow('Ticket not found')
  })
})
