import { describe, it, expect, beforeEach } from 'vitest'
import { ResetModule } from './ResetModule'
import { AdminRepository } from '../ports/AdminRepository'
import { EventStore } from '../../EventStore'

class MockAdminRepo implements AdminRepository {
  validate = true
  async isSetupNeeded(): Promise<boolean> { return false }
  async setupPassword(): Promise<void> {}
  async validatePassword(): Promise<boolean> { return this.validate }
}

class MockEventStore {
  lastEvent: any = null
  events: any[] = []
  append(event: any): void {
    this.lastEvent = event
    this.events.push(event)
  }
  replayModuleSinceLastReset(): Promise<any[]> {
    return Promise.resolve([])
  }
}

describe('ResetModule', () => {
  let mockAdminRepo: MockAdminRepo
  let mockEventStore: MockEventStore

  beforeEach(() => {
    mockAdminRepo = new MockAdminRepo()
    mockEventStore = new MockEventStore()
  })

  it('throws when password is invalid', async () => {
    mockAdminRepo.validate = false
    const usecase = new ResetModule(mockEventStore as unknown as EventStore, mockAdminRepo)
    await expect(usecase.execute('crew', 'wrong')).rejects.toThrow('Invalid password')
  })

  it('appends ModuleResetInitiated event with correct module', async () => {
    const usecase = new ResetModule(mockEventStore as unknown as EventStore, mockAdminRepo)
    await usecase.execute('crew', 'correct')
    expect(mockEventStore.lastEvent.type).toBe('ModuleResetInitiated')
    expect(mockEventStore.lastEvent.payload.module).toBe('crew')
  })

  it('appends ModuleResetInitiated event for fest module', async () => {
    const usecase = new ResetModule(mockEventStore as unknown as EventStore, mockAdminRepo)
    await usecase.execute('fest', 'correct')
    expect(mockEventStore.lastEvent.payload.module).toBe('fest')
  })

  it('appends ModuleResetInitiated event for mioum module', async () => {
    const usecase = new ResetModule(mockEventStore as unknown as EventStore, mockAdminRepo)
    await usecase.execute('mioum', 'correct')
    expect(mockEventStore.lastEvent.payload.module).toBe('mioum')
  })
})
