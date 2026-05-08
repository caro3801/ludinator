import { Database } from 'bun:sqlite'

export class EventStore {
  #db

  constructor(path = 'ludinator.db') {
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

  append({ id, module, type, aggregateId, payload, occurredAt }) {
    this.#db.run(
      `INSERT INTO events (id, module, type, aggregate_id, payload, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, module, type, aggregateId ?? null, JSON.stringify(payload), occurredAt]
    )
  }

  replayModule(module) {
    const rows = this.#db.query(
      `SELECT * FROM events WHERE module = ? ORDER BY occurred_at ASC`
    ).all(module)
    return rows.map(row => ({ ...row, payload: JSON.parse(row.payload) }))
  }
}
