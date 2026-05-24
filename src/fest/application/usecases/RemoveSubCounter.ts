import { EntryLog } from '../../domain/model/EntryLog'
import { SubCounterRemoved } from '../../domain/events'
import { EditionId, EntryId } from '../../../shared/types'

interface RemoveSubCounterParams {
  entryLog: { id: EntryId, editionId: EditionId, subCounters: { id: string, label: string, batches: { id: string, adults: number, children: number, families: number, timestamp: number }[] }[] }
  subCounterId: string
}

export class RemoveSubCounter {
  execute({ entryLog: entryLogData, subCounterId }: RemoveSubCounterParams): SubCounterRemoved {
    const log = EntryLog.fromJSON(entryLogData)
    log.removeSubCounter(subCounterId)
    return new SubCounterRemoved({ entryLog: log.toJSON() })
  }
}
