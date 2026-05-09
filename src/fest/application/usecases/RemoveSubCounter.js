import { EntryLog } from '../../domain/model/EntryLog.js'
import { SubCounterRemoved } from '../../domain/events.js'

export class RemoveSubCounter {
  execute({ entryLog: entryLogData, subCounterId }) {
    const log = EntryLog.fromJSON(entryLogData)
    log.removeSubCounter(subCounterId)
    return new SubCounterRemoved({ entryLog: log.toJSON() })
  }
}
