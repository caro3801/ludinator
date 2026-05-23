import { CreatePost } from '../../application/usecases/CreatePost'
import { PostCreated } from '../../domain/events'

export class CrewPostForm extends HTMLElement {
  #useCase: CreatePost | null = null

  set createPostUseCase(uc: CreatePost) { this.#useCase = uc }

  connectedCallback() {
    this.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Nom du poste" required />
        <input type="number" name="minVolunteers" min="1" value="1" required />
        <button type="submit">Créer</button>
      </form>
    `
    const form = this.querySelector('form')
    if (form) form.addEventListener('submit', e => this.#onSubmit(e))
  }

  async #onSubmit(e: SubmitEvent) {
    e.preventDefault()
    const nameInput = this.querySelector<HTMLInputElement>('[name="name"]')
    const minInput = this.querySelector<HTMLInputElement>('[name="minVolunteers"]')
    if (!nameInput || !minInput) return
    const name = nameInput.value.trim()
    const minVolunteers = parseInt(minInput.value, 10)
    if (!this.#useCase) return
    try {
      const postCreated = await this.#useCase.execute({ name, minVolunteers })
      this.dispatchEvent(new CustomEvent('post-created', { detail: postCreated, bubbles: true }))
      e.target.reset()
      minInput.value = '1'
    } catch (err) {
      if (err instanceof Error) {
        this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
      }
    }
  }
}

customElements.define('crew-post-form', CrewPostForm)
