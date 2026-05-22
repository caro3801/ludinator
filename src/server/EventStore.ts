import { Database } from 'bun:sqlite'

/**
 * Event storage using SQLite via Bun
 */
export class EventStore {
  readonly #db: Database

  constructor(path: string = 'ludinator.db') {
    this.#db = new Database(path)
    this.#db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        module TEXT NOT NULL,
        type TEXT NOT NULL,
        aggregate_id TEXT,
        payload TEXT NOT NULL,
        occurred_at TEXT NOT NULL
      )
    `)
  }

  /**
   * Append an event to the store
   */
  append(event: {
    id: string
    module: string
    type: string
    aggregateId?: string | null
    payload: unknown
    occurredAt: string
  }): void {
    this.#db.run(
      `INSERT INTO events (id, module, type, aggregate_id, payload, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [event.id, event.module, event.type, event.aggregateId ?? null, JSON.stringify(event.payload), event.occurredAt]
    )
  }

  /**
   * Replay all events for a specific module
   */
  replayModule(module: string): Array<{
    id: string
    module: string
    type: string
    aggregate_id: string | null
    payload: unknown
    occurred_at: string
  }> {
    interface Row {
      id: string
      module: string
      type: string
      aggregate_id: string | null
      payload: string
      occurred_at: string
    }
    const rows: Row[] = this.#db
      .query(`SELECT * FROM events WHERE module = ? ORDER BY occurred_at ASC`)
      .all(module) as Row[]
    return rows.map((row) => ({ ...row, payload: JSON.parse(row.payload) }))
  }

  /**
   * Replay all events for a specific module, excluding those before the last reset
   */
  async replayModuleSinceLastReset(module: string): Promise<Array<{
    id: string
    module: string
    type: string
    aggregate_id: string | null
    payload: unknown
    occurred_at: string
  }>> {
    interface Row {
      id: string
      module: string
      type: string
      aggregate_id: string | null
      payload: string
      occurred_at: string
    }

    // Trouver le dernier ModuleResetInitiated pour ce module
    interface ResetRow {
      occurred_at: string
    }
    const resetRows: ResetRow[] = this.#db
      .query(`SELECT occurred_at FROM events WHERE module = 'admin' AND type = 'ModuleResetInitiated' AND json_extract(payload, '$.module') = ? ORDER BY occurred_at DESC LIMIT 1`)
      .all(module) as ResetRow[]

    if (resetRows.length === 0) {
      // Pas de reset, retourner tous les événements
      return this.replayModule(module)
    }

    const lastResetAt = resetRows[0].occurred_at

    // Retourner tous les événements du module après le reset
    const rows: Row[] = this.#db
      .query(`SELECT * FROM events WHERE module = ? AND occurred_at > ? ORDER BY occurred_at ASC`)
      .all(module, lastResetAt) as Row[]

    return rows.map((row) => ({ ...row, payload: JSON.parse(row.payload) }))
  }
}
