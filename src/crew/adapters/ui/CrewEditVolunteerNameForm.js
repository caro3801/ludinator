export class CrewEditVolunteerNameForm extends HTMLElement {
  #useCase = null
  #volunteerId = null

  set updateVolunteerNameUseCase(uc) { this.#useCase = uc }

  connectedCallback() {
    this.hidden = true
    this.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Nom du bénévole" required />
        <button type="submit">Renommer</button>
        <button type="button" data-action="cancel">Annuler</button>
      </form>
    `
    this.addEventListener('click', e => {
      if (e.target.closest('button[data-action="cancel"]')) this.hidden = true
    })
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  open({ volunteerId, name }) {
    this.#volunteerId = volunteerId
    this.querySelector('input[name="name"]').value = name
    this.hidden = false
  }

  async #onSubmit(e) {
    e.preventDefault()
    const name = this.querySelector('[name="name"]').value.trim()
    try {
      const volunteer = await this.#useCase.execute({ volunteerId: this.#volunteerId, name })
      this.dispatchEvent(new CustomEvent('volunteer-name-updated', { detail: volunteer, bubbles: true }))
      this.hidden = true
    } catch (err) {
      this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-edit-volunteer-name-form', CrewEditVolunteerNameForm)
