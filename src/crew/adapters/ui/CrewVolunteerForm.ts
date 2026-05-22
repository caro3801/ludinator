export class CrewVolunteerForm extends HTMLElement {
  #useCase = null

  set createVolunteerUseCase(uc) { this.#useCase = uc }

  connectedCallback() {
    this.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Nom du bénévole" required />
        <button type="submit">Ajouter</button>
      </form>
    `
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  async #onSubmit(e) {
    e.preventDefault()
    const name = this.querySelector('[name="name"]').value.trim()
    try {
      const volunteer = await this.#useCase.execute({ name })
      this.dispatchEvent(new CustomEvent('volunteer-created', { detail: volunteer, bubbles: true }))
      e.target.reset()
    } catch (err) {
      this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-volunteer-form', CrewVolunteerForm)
