import { describe, it, expect, beforeEach } from 'vitest'
import { AdminCommandHandler } from './AdminCommandHandler'
import { AdminRepository } from '../../application/ports/AdminRepository'
import { EventStore } from '../../EventStore'

class MockAdminRepo implements AdminRepository {
  setupNeeded = true
  validPassword = 'correct'
  async isSetupNeeded(): Promise<boolean> { return this.setupNeeded }
  async setupPassword(password: string): Promise<void> {
    this.setupNeeded = false
  }
  async validatePassword(password: string): Promise<boolean> {
    return password === this.validPassword
  }
}

class MockEventStore {
  events: any[] = []
  append(event: any): void {
    this.events.push(event)
  }
  replayModuleSinceLastReset(): Promise<any[]> {
    return Promise.resolve([])
  }
}

describe('AdminCommandHandler', () => {
  let handler: AdminCommandHandler
  let mockAdminRepo: MockAdminRepo
  let mockEventStore: MockEventStore

  beforeEach(() => {
    mockAdminRepo = new MockAdminRepo()
    mockEventStore = new MockEventStore()
    handler = new AdminCommandHandler(mockAdminRepo, mockEventStore as unknown as EventStore)
  })

  describe('handleCheckAdminSetup', () => {
    it('returns needs_setup when no password configured', async () => {
      mockAdminRepo.setupNeeded = true
      const result = await handler.handleCheckAdminSetup()
      expect(result).toEqual({ status: 'needs_setup' })
    })

    it('returns ready when password configured', async () => {
      mockAdminRepo.setupNeeded = false
      const result = await handler.handleCheckAdminSetup()
      expect(result).toEqual({ status: 'ready' })
    })
  })

  describe('handleSetupAdmin', () => {
    it('sets up password and returns ok', async () => {
      const result = await handler.handleSetupAdmin('mysecret')
      expect(result).toEqual({ status: 'ok' })
      expect(mockAdminRepo.setupNeeded).toBe(false)
    })
  })

  describe('handleAdminLogin', () => {
    it('returns ok for valid password', async () => {
      const result = await handler.handleAdminLogin('correct')
      expect(result).toEqual({ status: 'ok' })
    })

    it('returns invalid for wrong password', async () => {
      const result = await handler.handleAdminLogin('wrong')
      expect(result).toEqual({ status: 'invalid' })
    })
  })

  describe('handleResetModule', () => {
    it('returns invalid_password for wrong password', async () => {
      const result = await handler.handleResetModule('crew', 'wrong')
      expect(result).toEqual({ status: 'invalid_password' })
    })

    it('appends reset event and returns ok for valid password', async () => {
      const result = await handler.handleResetModule('crew', 'correct')
      expect(result).toEqual({ status: 'ok' })
      expect(mockEventStore.events.length).toBe(1)
      expect(mockEventStore.events[0].type).toBe('ModuleResetInitiated')
    })

    it('works for fest module', async () => {
      await handler.handleResetModule('fest', 'correct')
      expect(mockEventStore.events[0].payload.module).toBe('fest')
    })

    it('works for mioum module', async () => {
      await handler.handleResetModule('mioum', 'correct')
      expect(mockEventStore.events[0].payload.module).toBe('mioum')
    })
  })
})
