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
}
