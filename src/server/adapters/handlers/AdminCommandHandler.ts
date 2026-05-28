import { AdminRepository } from '../../application/ports/AdminRepository'
import { EventStore } from '../../EventStore'
import { ResetModule } from '../../application/usecases/ResetModule'
import { ModuleName } from '../../../shared/types'

interface CheckAdminSetupResponse {
  status: 'needs_setup' | 'ready'
}

interface SetupAdminResponse {
  status: 'ok'
}

interface AdminLoginResponse {
  status: 'ok' | 'invalid'
}

interface ResetModuleResponse {
  status: 'ok' | 'invalid_password'
}

export class AdminCommandHandler {
  constructor(
    private adminRepo: AdminRepository,
    private eventStore: EventStore
  ) {}

  async handleCheckAdminSetup(): Promise<CheckAdminSetupResponse> {
    const needsSetup = await this.adminRepo.isSetupNeeded()
    return { status: needsSetup ? 'needs_setup' : 'ready' }
  }

  async handleSetupAdmin(password: string): Promise<SetupAdminResponse> {
    await this.adminRepo.setupPassword(password)
    return { status: 'ok' }
  }

  async handleAdminLogin(password: string): Promise<AdminLoginResponse> {
    const isValid = await this.adminRepo.validatePassword(password)
    return { status: isValid ? 'ok' : 'invalid' }
  }

  async handleResetModule(
    module: string,
    password: string
  ): Promise<ResetModuleResponse> {
    const isValid = await this.adminRepo.validatePassword(password)
    if (!isValid) {
      return { status: 'invalid_password' }
    }

    await new ResetModule(this.eventStore, this.adminRepo).execute(
      module as ModuleName,
      password
    )

    return { status: 'ok' }
  }
}
