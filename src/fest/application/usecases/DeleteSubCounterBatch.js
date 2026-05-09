import { EntryLog } from '../../domain/model/EntryLog.js'
import { SubCounterBatchDeleted } from '../../domain/events.js'

export class DeleteSubCounterBatch {
  execute({ entryLog: entryLogData, subCounterId, batchId }) {
    const log = EntryLog.fromJSON(entryLogData)
    log.findSubCounter(subCounterId).removeBatch(batchId)
    return new SubCounterBatchDeleted({ entryLog: log.toJSON() })
  }
}
