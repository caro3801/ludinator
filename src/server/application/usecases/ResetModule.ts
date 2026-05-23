import { EventStore } from '../../EventStore'
import { AdminRepository } from '../ports/AdminRepository'
import { EventId, ModuleName } from '../../../shared/types'

export class ResetModule {
  constructor(
    private eventStore: EventStore,
    private adminRepo: AdminRepository
  ) {}

  async execute(module: ModuleName, password: string): Promise<void> {
    const isValid = await this.adminRepo.validatePassword(password)
    if (!isValid) {
      throw new Error('Invalid password')
    }

    // Clear all events for the module being reset
    this.eventStore.clearModule(module)

    // Record the reset in admin module
    const eventId: EventId = crypto.randomUUID()
    this.eventStore.append({
      id: eventId,
      module: 'admin',
      type: 'ModuleResetInitiated',
      aggregateId: null,
      payload: { module },
      occurredAt: new Date().toISOString()
    })
  }
}
