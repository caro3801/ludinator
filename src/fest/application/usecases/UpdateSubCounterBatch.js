export class UpdateSubCounterBatch {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ editionId, subCounterId, batchId, adults, children, families }) {
    const log = await this.#repo.findByEdition(editionId)
    log.findSubCounter(subCounterId).updateBatch(batchId, { adults, children, families })
    await this.#repo.save(log)
  }
}
