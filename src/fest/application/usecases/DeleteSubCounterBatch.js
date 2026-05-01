export class DeleteSubCounterBatch {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ editionId, subCounterId, batchId }) {
    const log = await this.#repo.findByEdition(editionId)
    log.findSubCounter(subCounterId).removeBatch(batchId)
    await this.#repo.save(log)
  }
}
