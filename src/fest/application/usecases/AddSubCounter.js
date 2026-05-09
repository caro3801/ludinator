import { EntryLog } from '../../domain/model/EntryLog.js'
import { SubCounterAdded } from '../../domain/events.js'

export class AddSubCounter {
  execute({ entryLog: entryLogData, label, editionId }) {
    const log = entryLogData ? EntryLog.fromJSON(entryLogData) : EntryLog.create(editionId)
    log.addSubCounter(label)
    return new SubCounterAdded({ entryLog: log.toJSON() })
  }
}
