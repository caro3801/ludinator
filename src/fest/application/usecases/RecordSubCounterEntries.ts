import { EntryLog } from '../../domain/model/EntryLog'
import { EntriesRecorded } from '../../domain/events'
import { EditionId, EntryId } from '../../../shared/types'

interface RecordSubCounterEntriesParams {
  entryLog: { id: EntryId, editionId: EditionId, subCounters: { id: string, label: string, batches: { id: string, adults: number, children: number, families: number, timestamp: number }[] }[] }
  subCounterId: string
  adults: number
  children: number
  families: number
}

export class RecordSubCounterEntries {
  execute({ entryLog: entryLogData, subCounterId, adults, children, families }: RecordSubCounterEntriesParams): EntriesRecorded {
    const log = EntryLog.fromJSON(entryLogData)
    log.findSubCounter(subCounterId).addBatch({ adults, children, families })
    return new EntriesRecorded({ entryLog: log.toJSON() })
  }
}
