import { EntryLog } from '../../domain/model/EntryLog.js'
import { EntriesRecorded } from '../../domain/events.js'

export class RecordSubCounterEntries {
  execute({ entryLog: entryLogData, subCounterId, adults, children, families }) {
    const log = EntryLog.fromJSON(entryLogData)
    log.findSubCounter(subCounterId).addBatch({ adults, children, families })
    return new EntriesRecorded({ entryLog: log.toJSON() })
  }
}
