import { describe, it, expect, beforeEach } from 'vitest'
import { SqliteAdminRepository } from './SqliteAdminRepository'
import { Database } from 'bun:sqlite'

describe('SqliteAdminRepository', () => {
  let repo: SqliteAdminRepository
  let db: Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.run('CREATE TABLE admin_config (id TEXT PRIMARY KEY, password_hash TEXT NOT NULL)')
    repo = new SqliteAdminRepository(db)
  })

  it('returns true when no admin config exists', async () => {
    expect(await repo.isSetupNeeded()).toBe(true)
  })

  it('returns false after setup', async () => {
    await repo.setupPassword('secret123')
    expect(await repo.isSetupNeeded()).toBe(false)
  })

  it('validates correct password', async () => {
    await repo.setupPassword('secret123')
    expect(await repo.validatePassword('secret123')).toBe(true)
  })

  it('rejects incorrect password', async () => {
    await repo.setupPassword('secret123')
    expect(await repo.validatePassword('wrong')).toBe(false)
  })

  it('rejects empty password', async () => {
    await repo.setupPassword('secret123')
    expect(await repo.validatePassword('')).toBe(false)
  })

  it('updates password on subsequent setup', async () => {
    await repo.setupPassword('old')
    await repo.setupPassword('new')
    expect(await repo.validatePassword('old')).toBe(false)
    expect(await repo.validatePassword('new')).toBe(true)
  })
})
