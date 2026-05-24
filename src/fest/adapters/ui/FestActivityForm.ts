interface CreateActivityUseCase {
  execute(params: { name: string; location: string | null }): Promise<unknown>
}

export class FestActivityForm extends HTMLElement {
  #useCase: CreateActivityUseCase | null = null

  set createActivityUseCase(uc: CreateActivityUseCase) { this.#useCase = uc }

  connectedCallback(): void {
    this.innerHTML = `
      <form>
        <div class="mb-2">
          <input class="form-control" type="text" name="name" placeholder="Nom de l'activité" required />
        </div>
        <div class="mb-2">
          <input class="form-control" type="text" name="location" placeholder="Lieu (optionnel)" />
        </div>
        <button class="btn btn-primary btn-sm" type="submit">Créer</button>
      </form>
    `
    const form = this.querySelector('form')
    if (form) form.addEventListener('submit', (e: Event) => this.#onSubmit(e as SubmitEvent))
  }

  async #onSubmit(e: SubmitEvent): Promise<void> {
    e.preventDefault()
    const name = (this.querySelector<HTMLInputElement>('[name="name"]'))?.value.trim() ?? ''
    const locationRaw = (this.querySelector<HTMLInputElement>('[name="location"]'))?.value.trim()
    const location = locationRaw || null
    if (!this.#useCase) return
    try {
      const activity = await this.#useCase.execute({ name, location })
      this.dispatchEvent(new CustomEvent('activity-created', { detail: activity, bubbles: true }))
      this.querySelector('form')?.reset()
    } catch (err) {
      this.dispatchEvent(new CustomEvent('fest-error', { detail: { message: err instanceof Error ? err.message : String(err) }, bubbles: true }))
    }
  }
}

customElements.define('fest-activity-form', FestActivityForm)
