import { describe, it, expect, beforeEach } from 'vitest'
import { CloseTicket } from './CloseTicket.js'
import { OpenTicket } from './OpenTicket.js'
import { InMemoryTicketRepository } from '../../adapters/storage/InMemoryTicketRepository.js'
import { InMemoryProductRepository } from '../../adapters/storage/InMemoryProductRepository.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'
import { Product } from '../../domain/model/Product.js'

describe('CloseTicket', () => {
  let ticketRepo, productRepo, useCase, openTicket

  beforeEach(() => {
    ticketRepo = new InMemoryTicketRepository()
    productRepo = new InMemoryProductRepository()
    useCase = new CloseTicket(ticketRepo)
    openTicket = new OpenTicket(ticketRepo)
  })

  async function openTicketWithLine() {
    const ticket = await openTicket.execute()
    const product = Product.create('Café', 1.50, 'Boissons')
    await productRepo.save(product)
    ticket.addLine(product.id, product.name.value, product.price.value, 1)
    await ticketRepo.save(ticket)
    return ticket
  }

  it('closes a ticket with paymentMethod cash', async () => {
    const ticket = await openTicketWithLine()
    const closed = await useCase.execute({ ticketId: ticket.id, paymentMethod: 'cash' })
    expect(closed.status).toBe('closed')
    expect(closed.paymentMethod).toBe('cash')
  })

  it('closes a ticket with null paymentMethod', async () => {
    const ticket = await openTicketWithLine()
    const closed = await useCase.execute({ ticketId: ticket.id, paymentMethod: null })
    expect(closed.status).toBe('closed')
    expect(closed.paymentMethod).toBeNull()
  })

  it('throws ValidationError when closing an empty ticket', async () => {
    const ticket = await openTicket.execute()
    await expect(
      useCase.execute({ ticketId: ticket.id, paymentMethod: 'cash' })
    ).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError when closing an already-closed ticket', async () => {
    const ticket = await openTicketWithLine()
    await useCase.execute({ ticketId: ticket.id, paymentMethod: 'cash' })
    await expect(
      useCase.execute({ ticketId: ticket.id, paymentMethod: 'cash' })
    ).rejects.toThrow(ValidationError)
  })

  it('throws when ticketId is unknown', async () => {
    await expect(
      useCase.execute({ ticketId: 'nonexistent', paymentMethod: 'cash' })
    ).rejects.toThrow('Ticket not found')
  })

  it('throws ValidationError when paymentMethod is invalid', async () => {
    const ticket = await openTicketWithLine()
    await expect(
      useCase.execute({ ticketId: ticket.id, paymentMethod: 'bitcoin' })
    ).rejects.toThrow(ValidationError)
  })
})
