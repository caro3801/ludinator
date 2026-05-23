import { EntryLog } from '../../domain/model/EntryLog'
import { SubCounterBatchUpdated } from '../../domain/events'
import { EditionId, EntryId } from '../../../shared/types'

interface UpdateSubCounterBatchParams {
  entryLog: { id: EntryId, editionId: EditionId, subCounters: { id: string, label: string, batches: { id: string, adults: number, children: number, families: number, recordedAt: number }[] }[] }
  subCounterId: string
  batchId: string
  adults: number
  children: number
  families: number
}

export class UpdateSubCounterBatch {
  execute({ entryLog: entryLogData, subCounterId, batchId, adults, children, families }: UpdateSubCounterBatchParams): SubCounterBatchUpdated {
    const log = EntryLog.fromJSON(entryLogData)
    log.findSubCounter(subCounterId).updateBatch(batchId, { adults, children, families })
    return new SubCounterBatchUpdated({ entryLog: log.toJSON() })
  }
}
