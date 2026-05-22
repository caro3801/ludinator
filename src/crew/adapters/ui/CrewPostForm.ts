export class CrewPostForm extends HTMLElement {
  #useCase = null

  set createPostUseCase(uc) { this.#useCase = uc }

  connectedCallback() {
    this.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Nom du poste" required />
        <input type="number" name="minVolunteers" min="1" value="1" required />
        <button type="submit">Créer</button>
      </form>
    `
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  async #onSubmit(e) {
    e.preventDefault()
    const name = this.querySelector('[name="name"]').value.trim()
    const minVolunteers = parseInt(this.querySelector('[name="minVolunteers"]').value, 10)
    try {
      const post = await this.#useCase.execute({ name, minVolunteers })
      this.dispatchEvent(new CustomEvent('post-created', { detail: post, bubbles: true }))
      e.target.reset()
      this.querySelector('[name="minVolunteers"]').value = '1'
    } catch (err) {
      this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-post-form', CrewPostForm)
