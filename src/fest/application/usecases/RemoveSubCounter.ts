import { EntryLog } from '../../domain/model/EntryLog'
import { SubCounterRemoved } from '../../domain/events'

export class RemoveSubCounter {
  execute({ entryLog: entryLogData, subCounterId }) {
    const log = EntryLog.fromJSON(entryLogData)
    log.removeSubCounter(subCounterId)
    return new SubCounterRemoved({ entryLog: log.toJSON() })
  }
}
