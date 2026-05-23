import { EntryLog } from '../../domain/model/EntryLog'
import { SubCounterBatchDeleted } from '../../domain/events'
import { EditionId, EntryId } from '../../../shared/types'

interface DeleteSubCounterBatchParams {
  entryLog: { id: EntryId, editionId: EditionId, subCounters: { id: string, label: string, batches: { id: string, adults: number, children: number, families: number, recordedAt: number }[] }[] }
  subCounterId: string
  batchId: string
}

export class DeleteSubCounterBatch {
  execute({ entryLog: entryLogData, subCounterId, batchId }: DeleteSubCounterBatchParams): SubCounterBatchDeleted {
    const log = EntryLog.fromJSON(entryLogData)
    log.findSubCounter(subCounterId).removeBatch(batchId)
    return new SubCounterBatchDeleted({ entryLog: log.toJSON() })
  }
}
