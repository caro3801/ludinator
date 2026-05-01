import { describe, it, expect, beforeEach } from 'vitest'
import { RemoveLineFromTicket } from './RemoveLineFromTicket.js'
import { OpenTicket } from './OpenTicket.js'
import { InMemoryTicketRepository } from '../../adapters/storage/InMemoryTicketRepository.js'
import { InMemoryProductRepository } from '../../adapters/storage/InMemoryProductRepository.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'
import { Product } from '../../domain/model/Product.js'

describe('RemoveLineFromTicket', () => {
  let ticketRepo, productRepo, useCase, openTicket

  beforeEach(() => {
    ticketRepo = new InMemoryTicketRepository()
    productRepo = new InMemoryProductRepository()
    useCase = new RemoveLineFromTicket(ticketRepo)
    openTicket = new OpenTicket(ticketRepo)
  })

  it('removes an existing line, leaving ticket empty with total 0', async () => {
    const ticket = await openTicket.execute()
    const product = Product.create('Bière', 3.00)
    await productRepo.save(product)
    const line = ticket.addLine(product.id, product.name.value, product.price.value, 2)
    await ticketRepo.save(ticket)

    await useCase.execute({ ticketId: ticket.id, lineId: line.id })

    const saved = await ticketRepo.findById(ticket.id)
    expect(saved.lines).toHaveLength(0)
    expect(saved.total).toBe(0)
  })

  it('throws ValidationError when removing from a closed ticket', async () => {
    const ticket = await openTicket.execute()
    const product = Product.create('Bière', 3.00)
    await productRepo.save(product)
    const line = ticket.addLine(product.id, product.name.value, product.price.value, 1)
    ticket.close('cash')
    await ticketRepo.save(ticket)

    await expect(
      useCase.execute({ ticketId: ticket.id, lineId: line.id })
    ).rejects.toThrow(ValidationError)
  })

  it('throws when ticketId is unknown', async () => {
    await expect(
      useCase.execute({ ticketId: 'nonexistent', lineId: 'whatever' })
    ).rejects.toThrow('Ticket not found')
  })

  it('silently no-ops when lineId does not exist on the ticket', async () => {
    const ticket = await openTicket.execute()
    await useCase.execute({ ticketId: ticket.id, lineId: 'nonexistent-line' })
    const saved = await ticketRepo.findById(ticket.id)
    expect(saved.lines).toHaveLength(0)
  })
})
