export class RemoveSubCounter {
  #repo
  constructor(repo) { this.#repo = repo }

  async execute({ editionId, subCounterId }) {
    const log = await this.#repo.findByEdition(editionId)
    log.removeSubCounter(subCounterId)
    await this.#repo.save(log)
  }
}
