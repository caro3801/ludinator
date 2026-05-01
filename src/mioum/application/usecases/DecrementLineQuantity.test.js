import { describe, it, expect, beforeEach } from 'vitest'
import { DecrementLineQuantity } from './DecrementLineQuantity.js'
import { OpenTicket } from './OpenTicket.js'
import { InMemoryTicketRepository } from '../../adapters/storage/InMemoryTicketRepository.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'

describe('DecrementLineQuantity', () => {
  let ticketRepo, useCase, openTicket

  beforeEach(() => {
    ticketRepo = new InMemoryTicketRepository()
    useCase = new DecrementLineQuantity(ticketRepo)
    openTicket = new OpenTicket(ticketRepo)
  })

  it('decrements the line quantity by 1 and persists', async () => {
    const ticket = await openTicket.execute()
    const line = ticket.addLine('prod-1', 'Crêpe', 2.50, 3)
    await ticketRepo.save(ticket)

    const updated = await useCase.execute({ ticketId: ticket.id, lineId: line.id })
    expect(updated.lines[0].quantity).toBe(2)
    expect((await ticketRepo.findById(ticket.id)).lines[0].quantity).toBe(2)
  })

  it('removes the line when quantity was 1', async () => {
    const ticket = await openTicket.execute()
    const line = ticket.addLine('prod-1', 'Crêpe', 2.50, 1)
    await ticketRepo.save(ticket)

    const updated = await useCase.execute({ ticketId: ticket.id, lineId: line.id })
    expect(updated.lines).toHaveLength(0)
  })

  it('throws ValidationError when ticket is closed', async () => {
    const ticket = await openTicket.execute()
    const line = ticket.addLine('prod-1', 'Crêpe', 2.50, 2)
    ticket.close('cash')
    await ticketRepo.save(ticket)

    await expect(useCase.execute({ ticketId: ticket.id, lineId: line.id })).rejects.toThrow(ValidationError)
  })

  it('throws when ticketId is unknown', async () => {
    await expect(useCase.execute({ ticketId: 'unknown', lineId: 'whatever' })).rejects.toThrow('Ticket not found')
  })
})
