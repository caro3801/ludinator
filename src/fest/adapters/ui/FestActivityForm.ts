export class FestActivityForm extends HTMLElement {
  #useCase = null

  set createActivityUseCase(uc) { this.#useCase = uc }

  connectedCallback() {
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
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  async #onSubmit(e) {
    e.preventDefault()
    const name = this.querySelector('[name="name"]').value.trim()
    const locationRaw = this.querySelector('[name="location"]').value.trim()
    const location = locationRaw || null
    try {
      const activity = await this.#useCase.execute({ name, location })
      this.dispatchEvent(new CustomEvent('activity-created', { detail: activity, bubbles: true }))
      this.querySelector('form').reset()
    } catch (err) {
      this.dispatchEvent(new CustomEvent('fest-error', { detail: { message: err.message }, bubbles: true }))
    }
  }
}

customElements.define('fest-activity-form', FestActivityForm)
