import { EntryLog } from '../../domain/model/EntryLog.js'
import { SubCounterBatchUpdated } from '../../domain/events.js'

export class UpdateSubCounterBatch {
  execute({ entryLog: entryLogData, subCounterId, batchId, adults, children, families }) {
    const log = EntryLog.fromJSON(entryLogData)
    log.findSubCounter(subCounterId).updateBatch(batchId, { adults, children, families })
    return new SubCounterBatchUpdated({ entryLog: log.toJSON() })
  }
}
