export class RecordSubCounterEntries {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ editionId, subCounterId, adults, children, families }) {
    const log = await this.#repo.findByEdition(editionId)
    const sc = log.findSubCounter(subCounterId)
    const batch = sc.addBatch({ adults, children, families })
    await this.#repo.save(log)
    return batch
  }
}
