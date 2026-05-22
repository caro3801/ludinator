export interface AdminRepository {
  isSetupNeeded(): Promise<boolean>
  setupPassword(password: string): Promise<void>
  validatePassword(password: string): Promise<boolean>
}
