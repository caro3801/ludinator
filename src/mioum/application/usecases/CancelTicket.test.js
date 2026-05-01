import { describe, it, expect, beforeEach } from 'vitest'
import { CancelTicket } from './CancelTicket.js'
import { OpenTicket } from './OpenTicket.js'
import { InMemoryTicketRepository } from '../../adapters/storage/InMemoryTicketRepository.js'
import { InMemoryProductRepository } from '../../adapters/storage/InMemoryProductRepository.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'
import { Product } from '../../domain/model/Product.js'

describe('CancelTicket', () => {
  let ticketRepo, productRepo, useCase, openTicket

  beforeEach(() => {
    ticketRepo = new InMemoryTicketRepository()
    productRepo = new InMemoryProductRepository()
    useCase = new CancelTicket(ticketRepo)
    openTicket = new OpenTicket(ticketRepo)
  })

  it('cancels an open ticket, setting status to cancelled', async () => {
    const ticket = await openTicket.execute()
    const cancelled = await useCase.execute({ ticketId: ticket.id })
    expect(cancelled.status).toBe('cancelled')
  })

  it('throws ValidationError when cancelling an already-closed ticket', async () => {
    const ticket = await openTicket.execute()
    const product = Product.create('Eau', 1.00)
    await productRepo.save(product)
    ticket.addLine(product.id, product.name.value, product.price.value, 1)
    ticket.close('cash')
    await ticketRepo.save(ticket)

    await expect(
      useCase.execute({ ticketId: ticket.id })
    ).rejects.toThrow(ValidationError)
  })

  it('throws when ticketId is unknown', async () => {
    await expect(
      useCase.execute({ ticketId: 'nonexistent' })
    ).rejects.toThrow('Ticket not found')
  })

  it('throws ValidationError when ticket is already cancelled', async () => {
    const ticket = await openTicket.execute()
    await useCase.execute({ ticketId: ticket.id })
    await expect(
      useCase.execute({ ticketId: ticket.id })
    ).rejects.toThrow('Ticket is not open')
  })
})
