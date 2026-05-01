import { ValidationError } from '../errors/ValidationError.js'
import { generateId } from '../../../shared/generateId.js'

class BatchContainer {
  #batches

  constructor(batches = []) {
    this.#batches = batches
  }

  get batches() { return [...this.#batches] }
  get totalAdults() { return this.#batches.reduce((s, b) => s + b.adults, 0) }
  get totalChildren() { return this.#batches.reduce((s, b) => s + b.children, 0) }
  get totalFamilies() { return this.#batches.reduce((s, b) => s + b.families, 0) }
  get total() { return this.totalAdults + this.totalChildren }

  addBatch({ adults, children, families }) {
    const batch = EntryBatch.create(adults, children, families)
    this.#batches.push(batch)
    return batch
  }

  updateBatch(id, { adults, children, families }) {
    const batch = this.#batches.find(b => b.id === id)
    if (!batch) throw new ValidationError(`Batch not found: ${id}`)
    batch.update({ adults, children, families })
  }

  removeBatch(id) {
    this.#batches = this.#batches.filter(b => b.id !== id)
  }

  _batchesToJSON() {
    return this.#batches.map(b => b.toJSON())
  }
}

class SubCounter extends BatchContainer {
  #id
  #label

  constructor(id, label, batches = []) {
    super(batches)
    this.#id = id
    this.#label = label
  }

  get id() { return this.#id }
  get label() { return this.#label }

  toJSON() {
    return { id: this.#id, label: this.#label, batches: this._batchesToJSON() }
  }

  static fromJSON({ id, label, batches }) {
    return new SubCounter(id, label, batches.map(b => EntryBatch.fromJSON(b)))
  }

  static create(label) {
    return new SubCounter(generateId(), label)
  }
}

class EntryBatch {
  #id
  #timestamp
  #adults
  #children
  #families

  constructor(id, timestamp, adults, children, families) {
    this.#id = id
    this.#timestamp = timestamp
    this.#adults = adults
    this.#children = children
    this.#families = families
  }

  get id() { return this.#id }
  get timestamp() { return this.#timestamp }
  get adults() { return this.#adults }
  get children() { return this.#children }
  get families() { return this.#families }

  update({ adults, children, families }) {
    this.#adults = adults
    this.#children = children
    this.#families = families
  }

  toJSON() {
    return { id: this.#id, timestamp: this.#timestamp, adults: this.#adults, children: this.#children, families: this.#families }
  }

  static fromJSON({ id, timestamp, adults, children, families }) {
    return new EntryBatch(id, timestamp, adults, children, families)
  }

  static create(adults, children, families) {
    return new EntryBatch(generateId(), Date.now(), adults, children, families)
  }
}

export class EntryLog {
  #id
  #editionId
  #subCounters

  constructor(id, editionId, subCounters = []) {
    this.#id = id
    this.#editionId = editionId
    this.#subCounters = subCounters
  }

  get id() { return this.#id }
  get editionId() { return this.#editionId }
  get subCounters() { return [...this.#subCounters] }

  get totalAdults() { return this.#subCounters.reduce((s, sc) => s + sc.totalAdults, 0) }
  get totalChildren() { return this.#subCounters.reduce((s, sc) => s + sc.totalChildren, 0) }
  get totalFamilies() { return this.#subCounters.reduce((s, sc) => s + sc.totalFamilies, 0) }
  get total() { return this.totalAdults + this.totalChildren }
  get allBatches() { return this.#subCounters.flatMap(sc => sc.batches) }

  addSubCounter(label) {
    const sc = SubCounter.create(label)
    this.#subCounters.push(sc)
    return sc
  }

  removeSubCounter(id) {
    this.#subCounters = this.#subCounters.filter(sc => sc.id !== id)
  }

  findSubCounter(id) {
    const sc = this.#subCounters.find(sc => sc.id === id)
    if (!sc) throw new ValidationError(`SubCounter not found: ${id}`)
    return sc
  }

  toJSON() {
    return {
      id: this.#id,
      editionId: this.#editionId,
      subCounters: this.#subCounters.map(sc => sc.toJSON()),
    }
  }

  static fromJSON({ id, editionId, subCounters = [] }) {
    return new EntryLog(
      id,
      editionId,
      subCounters.map(sc => SubCounter.fromJSON(sc)),
    )
  }

  static create(editionId) {
    return new EntryLog(generateId(), editionId)
  }
}
