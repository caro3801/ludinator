import { describe, it, expect, beforeEach } from 'vitest'
import { AddLineToTicket } from './AddLineToTicket.js'
import { OpenTicket } from './OpenTicket.js'
import { InMemoryTicketRepository } from '../../adapters/storage/InMemoryTicketRepository.js'
import { InMemoryProductRepository } from '../../adapters/storage/InMemoryProductRepository.js'
import { ValidationError } from '../../domain/errors/ValidationError.js'
import { Product } from '../../domain/model/Product.js'
import { Ticket } from '../../domain/model/Ticket.js'

describe('AddLineToTicket', () => {
  let ticketRepo, productRepo, useCase, openTicket

  beforeEach(() => {
    ticketRepo = new InMemoryTicketRepository()
    productRepo = new InMemoryProductRepository()
    useCase = new AddLineToTicket(ticketRepo, productRepo)
    openTicket = new OpenTicket(ticketRepo)
  })

  it('adds a valid line and returns a TicketLine with updated ticket total', async () => {
    const ticket = await openTicket.execute()
    const product = Product.create('Crêpe', 2.50, 'Snacks')
    await productRepo.save(product)

    const line = await useCase.execute({ ticketId: ticket.id, productId: product.id, quantity: 3 })

    expect(line).toBeDefined()
    expect(line.productId).toBe(product.id)
    expect(line.productName).toBe('Crêpe')
    expect(line.unitPrice).toBe(2.50)
    expect(line.quantity).toBe(3)
    expect(line.subtotal).toBe(7.50)

    const saved = await ticketRepo.findById(ticket.id)
    expect(saved.total).toBe(7.50)
  })

  it('throws when ticketId is unknown', async () => {
    const product = Product.create('Crêpe', 2.50, 'Snacks')
    await productRepo.save(product)

    await expect(
      useCase.execute({ ticketId: 'nonexistent', productId: product.id, quantity: 1 })
    ).rejects.toThrow('Ticket not found')
  })

  it('throws when productId is unknown', async () => {
    const ticket = await openTicket.execute()

    await expect(
      useCase.execute({ ticketId: ticket.id, productId: 'nonexistent', quantity: 1 })
    ).rejects.toThrow('Product not found')
  })

  it('throws ValidationError when adding to a closed ticket', async () => {
    const product = Product.create('Crêpe', 2.50, 'Snacks')
    await productRepo.save(product)
    const ticket = await openTicket.execute()
    ticket.addLine(product.id, product.name.value, product.price.value, 1)
    ticket.close('cash')
    await ticketRepo.save(ticket)

    await expect(
      useCase.execute({ ticketId: ticket.id, productId: product.id, quantity: 1 })
    ).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError when quantity < 1', async () => {
    const ticket = await openTicket.execute()
    const product = Product.create('Crêpe', 2.50, 'Snacks')
    await productRepo.save(product)

    await expect(
      useCase.execute({ ticketId: ticket.id, productId: product.id, quantity: 0 })
    ).rejects.toThrow(ValidationError)
  })
})
