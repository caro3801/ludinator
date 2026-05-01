import { describe, it, expect, beforeEach } from 'vitest'
import { OpenTicket } from './OpenTicket.js'
import { InMemoryTicketRepository } from '../../adapters/storage/InMemoryTicketRepository.js'

describe('OpenTicket', () => {
  let repo, useCase

  beforeEach(() => {
    repo = new InMemoryTicketRepository()
    useCase = new OpenTicket(repo)
  })

  it('execute() returns an open ticket', async () => {
    const ticket = await useCase.execute()
    expect(ticket.status).toBe('open')
  })

  it('persists the ticket in the repository', async () => {
    const ticket = await useCase.execute()
    const found = await repo.findById(ticket.id)
    expect(found).toBe(ticket)
  })

  it('returned ticket has status open', async () => {
    const ticket = await useCase.execute()
    expect(ticket.isOpen).toBe(true)
  })
})
