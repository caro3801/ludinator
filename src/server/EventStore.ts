import { Database } from 'bun:sqlite'
import { EventId } from '../shared/types'

interface StoredEventRow {
  id: EventId
  module: string
  type: string
  aggregate_id: string | null
  payload: string
  occurred_at: string
}

interface DomainEvent {
  id: EventId
  module: string
  type: string
  aggregateId?: string | null
  payload: unknown
  occurredAt: string
}

interface ReplayedEvent {
  id: EventId
  module: string
  type: string
  aggregate_id: string | null
  payload: unknown
  occurred_at: string
}

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
  append(event: DomainEvent): void {
    this.#db.run(
      `INSERT INTO events (id, module, type, aggregate_id, payload, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [event.id, event.module, event.type, event.aggregateId ?? null, JSON.stringify(event.payload), event.occurredAt]
    )
  }

  /**
   * Clear all events for a specific module
   */
  clearModule(module: string): void {
    this.#db.run(`DELETE FROM events WHERE module = ?`, [module])
  }

  /**
   * Replay all events for a specific module
   */
  replayModule(module: string): ReplayedEvent[] {
    const rows: StoredEventRow[] = this.#db
      .query(`SELECT * FROM events WHERE module = ? ORDER BY occurred_at ASC`)
      .all(module) as StoredEventRow[]
    return rows.map((row) => ({ ...row, payload: JSON.parse(row.payload) }))
  }

  /**
   * Replay all events for a specific module, excluding those before the last reset
   */
  async replayModuleSinceLastReset(module: string): Promise<ReplayedEvent[]> {
    interface ResetRow {
      occurred_at: string
    }

    const resetRows: ResetRow[] = this.#db
      .query(`SELECT occurred_at FROM events WHERE module = 'admin' AND type = 'ModuleResetInitiated' AND json_extract(payload, '$.module') = ? ORDER BY occurred_at DESC LIMIT 1`)
      .all(module) as ResetRow[]

    if (resetRows.length === 0) {
      return this.replayModule(module)
    }

    const lastResetAt = resetRows[0].occurred_at

    const rows: StoredEventRow[] = this.#db
      .query(`SELECT * FROM events WHERE module = ? AND occurred_at > ? ORDER BY occurred_at ASC`)
      .all(module, lastResetAt) as StoredEventRow[]

    return rows.map((row) => ({ ...row, payload: JSON.parse(row.payload) }))
  }
}
