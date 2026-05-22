import { EntryLog } from '../../domain/model/EntryLog'
import { SubCounterAdded } from '../../domain/events'

export class AddSubCounter {
  execute({ entryLog: entryLogData, label, editionId }) {
    const log = entryLogData ? EntryLog.fromJSON(entryLogData) : EntryLog.create(editionId)
    log.addSubCounter(label)
    return new SubCounterAdded({ entryLog: log.toJSON() })
  }
}
