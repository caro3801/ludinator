import { Database } from 'bun:sqlite'
import { AdminRepository } from '../../application/ports/AdminRepository'

export class SqliteAdminRepository implements AdminRepository {
  #db: Database

  constructor(db: Database) {
    this.#db = db
    this.#initTable()
  }

  #initTable(): void {
    this.#db.run(`
      CREATE TABLE IF NOT EXISTS admin_config (
        id TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL
      )
    `)
  }

  async isSetupNeeded(): Promise<boolean> {
    const row = this.#db
      .query('SELECT COUNT(*) as count FROM admin_config')
      .get() as { count: number }
    return row.count === 0
  }

  async setupPassword(password: string): Promise<void> {
    const hash = await this.#hashPassword(password)
    this.#db.run(
      'INSERT OR REPLACE INTO admin_config (id, password_hash) VALUES (?, ?)',
      ['admin', hash]
    )
  }

  async validatePassword(password: string): Promise<boolean> {
    const row = this.#db
      .query('SELECT password_hash FROM admin_config WHERE id = ?')
      .get('admin') as { password_hash: string } | null

    if (!row) return false
    return await this.#verifyPassword(password, row.password_hash)
  }

  async #hashPassword(pw: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(pw)
    )
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  async #verifyPassword(pw: string, hash: string): Promise<boolean> {
    const newHash = await this.#hashPassword(pw)
    // Comparaison timing-safe
    const newHashBytes = new TextEncoder().encode(newHash)
    const storedHashBytes = new TextEncoder().encode(hash)

    if (newHashBytes.length !== storedHashBytes.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < newHashBytes.length; i++) {
      result |= newHashBytes[i] ^ storedHashBytes[i]
    }
    return result === 0
  }
}
