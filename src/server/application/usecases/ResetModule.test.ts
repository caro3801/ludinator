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
  clearedModules: string[] = []
  append(event: any): void {
    this.lastEvent = event
    this.events.push(event)
  }
  clearModule(module: string): void {
    this.clearedModules.push(module)
    this.events = this.events.filter(e => e.module !== module)
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

  it('clears events for the module being reset', async () => {
    const usecase = new ResetModule(mockEventStore as unknown as EventStore, mockAdminRepo)
    // Add some crew events
    mockEventStore.append({ id: '1', module: 'crew', type: 'VolunteerCreated', payload: {} })
    mockEventStore.append({ id: '2', module: 'crew', type: 'PostCreated', payload: {} })
    mockEventStore.append({ id: '3', module: 'fest', type: 'ActivityCreated', payload: {} })
    
    expect(mockEventStore.events.length).toBe(3)
    
    await usecase.execute('crew', 'correct')
    
    // Crew events should be cleared, fest should remain, plus the admin reset event
    expect(mockEventStore.events.length).toBe(2)
    expect(mockEventStore.events.some(e => e.module === 'fest')).toBe(true)
    expect(mockEventStore.events.some(e => e.module === 'admin')).toBe(true)
    expect(mockEventStore.events.some(e => e.module === 'crew')).toBe(false)
    expect(mockEventStore.clearedModules).toContain('crew')
  })
})
