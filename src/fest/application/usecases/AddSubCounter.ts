import { EntryLog } from '../../domain/model/EntryLog'
import { SubCounterAdded } from '../../domain/events'
import { EditionId, EntryId } from '../../../shared/types'

interface AddSubCounterParams {
  entryLog: { id: EntryId, editionId: EditionId, subCounters: { id: string, label: string, batches: { id: string, adults: number, children: number, families: number, timestamp: number }[] }[] } | null
  label: string
  editionId: EditionId
}

export class AddSubCounter {
  execute({ entryLog: entryLogData, label, editionId }: AddSubCounterParams): SubCounterAdded {
    const log = entryLogData ? EntryLog.fromJSON(entryLogData) : EntryLog.create(editionId)
    log.addSubCounter(label)
    return new SubCounterAdded({ entryLog: log.toJSON() })
  }
}
