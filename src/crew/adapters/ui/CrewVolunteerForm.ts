import { CreateVolunteer } from '../../application/usecases/CreateVolunteer'
import { VolunteerCreated } from '../../domain/events'

export class CrewVolunteerForm extends HTMLElement {
  #useCase: CreateVolunteer | null = null

  set createVolunteerUseCase(uc: CreateVolunteer) { this.#useCase = uc }

  connectedCallback() {
    this.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Nom du bénévole" required />
        <button type="submit">Ajouter</button>
      </form>
    `
    const form = this.querySelector('form')
    if (form) form.addEventListener('submit', e => this.#onSubmit(e))
  }

  async #onSubmit(e: SubmitEvent) {
    e.preventDefault()
    const nameInput = this.querySelector<HTMLInputElement>('[name="name"]')
    if (!nameInput) return
    const name = nameInput.value.trim()
    if (!this.#useCase) return
    try {
      const volunteerCreated = await this.#useCase.execute({ name })
      this.dispatchEvent(new CustomEvent('volunteer-created', { detail: volunteerCreated, bubbles: true }))
      e.target.reset()
    } catch (err) {
      if (err instanceof Error) {
        this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
      }
    }
  }
}

customElements.define('crew-volunteer-form', CrewVolunteerForm)
