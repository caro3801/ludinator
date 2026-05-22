import { describe, it, expect } from 'vitest'
import { OpenTicket } from './OpenTicket'
import { TicketOpened } from '../../domain/events'

describe('OpenTicket', () => {
  it('emits TicketOpened with a new open ticket', () => {
    const event = new OpenTicket().execute()
    expect(event).toBeInstanceOf(TicketOpened)
    expect(event.payload.status).toBe('open')
    expect(event.payload.lines).toEqual([])
  })
})
