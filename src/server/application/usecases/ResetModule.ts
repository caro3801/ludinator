import { EventStore } from '../../EventStore'
import { AdminRepository } from '../ports/AdminRepository'

export class ResetModule {
  constructor(
    private eventStore: EventStore,
    private adminRepo: AdminRepository
  ) {}

  async execute(module: 'crew' | 'fest' | 'mioum', password: string): Promise<void> {
    const isValid = await this.adminRepo.validatePassword(password)
    if (!isValid) {
      throw new Error('Invalid password')
    }

    this.eventStore.append({
      id: crypto.randomUUID(),
      module: 'admin',
      type: 'ModuleResetInitiated',
      aggregateId: null,
      payload: { module },
      occurredAt: new Date().toISOString()
    })
  }
}
