import { ValidationError } from '../errors/ValidationError'
import { generateId } from '../../../shared/generateId'
import { EntryId } from '../../../shared/types'

interface EntryBatchData {
  id: string
  timestamp: number
  adults: number
  children: number
  families: number
}

interface SubCounterData {
  id: string
  label: string
  batches: EntryBatchData[]
}

export interface EntryLogData {
  id: EntryId
  editionId: string
  subCounters: SubCounterData[]
}

class EntryBatch {
  #id: string
  #timestamp: number
  #adults: number
  #children: number
  #families: number

  constructor(id: string, timestamp: number, adults: number, children: number, families: number) {
    this.#id = id
    this.#timestamp = timestamp
    this.#adults = adults
    this.#children = children
    this.#families = families
  }

  get id(): string { return this.#id }
  get timestamp(): number { return this.#timestamp }
  get adults(): number { return this.#adults }
  get children(): number { return this.#children }
  get families(): number { return this.#families }

  update({ adults, children, families }: { adults?: number, children?: number, families?: number }): void {
    if (adults !== undefined) this.#adults = adults
    if (children !== undefined) this.#children = children
    if (families !== undefined) this.#families = families
  }

  toJSON(): EntryBatchData {
    return { id: this.#id, timestamp: this.#timestamp, adults: this.#adults, children: this.#children, families: this.#families }
  }

  static fromJSON(data: EntryBatchData): EntryBatch {
    return new EntryBatch(data.id, data.timestamp, data.adults, data.children, data.families)
  }

  static create(adults: number, children: number, families: number): EntryBatch {
    return new EntryBatch(generateId(), Date.now(), adults, children, families)
  }
}

class BatchContainer {
  #batches: EntryBatch[]

  constructor(batches: EntryBatch[] = []) {
    this.#batches = batches
  }

  get batches(): EntryBatch[] { return [...this.#batches] }
  get totalAdults(): number { return this.#batches.reduce((s, b) => s + b.adults, 0) }
  get totalChildren(): number { return this.#batches.reduce((s, b) => s + b.children, 0) }
  get totalFamilies(): number { return this.#batches.reduce((s, b) => s + b.families, 0) }
  get total(): number { return this.totalAdults + this.totalChildren }

  addBatch({ adults, children, families }: { adults: number, children: number, families: number }): EntryBatch {
    const batch = EntryBatch.create(adults, children, families)
    this.#batches.push(batch)
    return batch
  }

  updateBatch(id: string, { adults, children, families }: { adults?: number, children?: number, families?: number }): void {
    const batch = this.#batches.find(b => b.id === id)
    if (!batch) throw new ValidationError(`Batch not found: ${id}`)
    batch.update({ adults, children, families })
  }

  removeBatch(id: string): void {
    this.#batches = this.#batches.filter(b => b.id !== id)
  }

  _batchesToJSON(): EntryBatchData[] {
    return this.#batches.map(b => b.toJSON())
  }
}

class SubCounter extends BatchContainer {
  #id: string
  #label: string

  constructor(id: string, label: string, batches: EntryBatch[] = []) {
    super(batches)
    this.#id = id
    this.#label = label
  }

  get id(): string { return this.#id }
  get label(): string { return this.#label }

  toJSON(): SubCounterData {
    return { id: this.#id, label: this.#label, batches: this._batchesToJSON() }
  }

  static fromJSON(data: SubCounterData): SubCounter {
    return new SubCounter(data.id, data.label, data.batches.map(b => EntryBatch.fromJSON(b)))
  }

  static create(label: string): SubCounter {
    return new SubCounter(generateId(), label)
  }
}

export class EntryLog {
  #id: EntryId
  #editionId: string
  #subCounters: SubCounter[]

  constructor(id: EntryId, editionId: string, subCounters: SubCounter[] = []) {
    this.#id = id
    this.#editionId = editionId
    this.#subCounters = subCounters
  }

  get id(): EntryId { return this.#id }
  get editionId(): string { return this.#editionId }
  get subCounters(): SubCounter[] { return [...this.#subCounters] }

  get totalAdults(): number { return this.#subCounters.reduce((s, sc) => s + sc.totalAdults, 0) }
  get totalChildren(): number { return this.#subCounters.reduce((s, sc) => s + sc.totalChildren, 0) }
  get totalFamilies(): number { return this.#subCounters.reduce((s, sc) => s + sc.totalFamilies, 0) }
  get total(): number { return this.totalAdults + this.totalChildren }
  get allBatches(): EntryBatch[] { return this.#subCounters.flatMap(sc => sc.batches) }

  addSubCounter(label: string): SubCounter {
    const sc = SubCounter.create(label)
    this.#subCounters.push(sc)
    return sc
  }

  removeSubCounter(id: string): void {
    this.#subCounters = this.#subCounters.filter(sc => sc.id !== id)
  }

  findSubCounter(id: string): SubCounter {
    const sc = this.#subCounters.find(sc => sc.id === id)
    if (!sc) throw new ValidationError(`SubCounter not found: ${id}`)
    return sc
  }

  toJSON(): EntryLogData {
    return {
      id: this.#id,
      editionId: this.#editionId,
      subCounters: this.#subCounters.map(sc => sc.toJSON()),
    }
  }

  static fromJSON(data: EntryLogData): EntryLog {
    return new EntryLog(
      data.id,
      data.editionId,
      data.subCounters.map(sc => SubCounter.fromJSON(sc)),
    )
  }

  static create(editionId: string): EntryLog {
    return new EntryLog(generateId() as EntryId, editionId)
  }
}
