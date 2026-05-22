import { describe, it, expect } from 'vitest'
import { CancelTicket } from './CancelTicket'
import { TicketCancelled } from '../../domain/events'
import { Ticket } from '../../domain/model/Ticket'

describe('CancelTicket', () => {
  it('emits TicketCancelled with status cancelled', () => {
    const ticket = Ticket.create()
    const event = new CancelTicket().execute({ ticket: ticket.toJSON() })
    expect(event).toBeInstanceOf(TicketCancelled)
    expect(event.payload.status).toBe('cancelled')
  })
})
