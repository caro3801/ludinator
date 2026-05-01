import { EntryLog } from '../../domain/model/EntryLog.js'

export class AddSubCounter {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ editionId, label }) {
    const log = (await this.#repo.findByEdition(editionId)) ?? EntryLog.create(editionId)
    const sc = log.addSubCounter(label)
    await this.#repo.save(log)
    return sc
  }
}
