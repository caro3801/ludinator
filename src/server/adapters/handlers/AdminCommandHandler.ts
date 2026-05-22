import { AdminRepository } from '../../application/ports/AdminRepository'
import { EventStore } from '../../EventStore'
import { ResetModule } from '../../application/usecases/ResetModule'

export class AdminCommandHandler {
  constructor(
    private adminRepo: AdminRepository,
    private eventStore: EventStore
  ) {}

  async handleCheckAdminSetup(): Promise<{ status: 'needs_setup' | 'ready' }> {
    const needsSetup = await this.adminRepo.isSetupNeeded()
    return { status: needsSetup ? 'needs_setup' : 'ready' }
  }

  async handleSetupAdmin(password: string): Promise<{ status: 'ok' }> {
    await this.adminRepo.setupPassword(password)
    return { status: 'ok' }
  }

  async handleAdminLogin(password: string): Promise<{ status: 'ok' | 'invalid' }> {
    const isValid = await this.adminRepo.validatePassword(password)
    return { status: isValid ? 'ok' : 'invalid' }
  }

  async handleResetModule(
    module: string,
    password: string
  ): Promise<{ status: 'ok' | 'invalid_password' }> {
    const isValid = await this.adminRepo.validatePassword(password)
    if (!isValid) {
      return { status: 'invalid_password' }
    }

    await new ResetModule(this.eventStore, this.adminRepo).execute(
      module as 'crew' | 'fest' | 'mioum',
      password
    )

    return { status: 'ok' }
  }
}
