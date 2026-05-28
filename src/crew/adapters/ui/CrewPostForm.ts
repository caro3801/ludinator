interface UseCase<T, R> {
  execute(params: T): Promise<R>
}

interface PostCreated {
  payload: { post: { id: string; name: { value: string }; minVolunteers: number } }
}

export class CrewPostForm extends HTMLElement {
  #useCase: UseCase<{ name: string; minVolunteers: number }, PostCreated> | null = null
  #formData: { name: string; minVolunteers: string } = { name: '', minVolunteers: '' }

  set createPostUseCase(uc: UseCase<{ name: string; minVolunteers: number }, PostCreated> | null) { this.#useCase = uc }

  connectedCallback() {
    this.#render()
  }

  #render() {
    this.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Nom du poste" required />
        <input type="number" name="minVolunteers" min="1" value="1" required />
        <button type="submit">Créer</button>
        <button type="reset" class="btn btn-outline-secondary ms-2">Effacer</button>
      </form>
    `
    const form = this.querySelector('form')
    if (form) form.addEventListener('submit', e => this.#onSubmit(e))
    this.#restoreFormData()
  }

  #saveFormData(): void {
    const nameInput = this.querySelector<HTMLInputElement>('[name="name"]')
    const minInput = this.querySelector<HTMLInputElement>('[name="minVolunteers"]')
    if (nameInput && minInput) {
      this.#formData = {
        name: nameInput.value,
        minVolunteers: minInput.value,
      }
    }
  }

  #restoreFormData(): void {
    const nameInput = this.querySelector<HTMLInputElement>('[name="name"]')
    const minInput = this.querySelector<HTMLInputElement>('[name="minVolunteers"]')
    if (nameInput && minInput) {
      nameInput.value = this.#formData.name
      minInput.value = this.#formData.minVolunteers
    }
  }

  async #onSubmit(e: SubmitEvent) {
    e.preventDefault()
    const nameInput = this.querySelector<HTMLInputElement>('[name="name"]')
    const minInput = this.querySelector<HTMLInputElement>('[name="minVolunteers"]')
    if (!nameInput || !minInput) return
    const name = nameInput.value.trim()
    const minVolunteers = parseInt(minInput.value, 10)
    if (!this.#useCase) return
    
    // Sauvegarder les données du formulaire avant soumission
    this.#saveFormData()
    
    try {
      const postCreated = await this.#useCase.execute({ name, minVolunteers })
      this.dispatchEvent(new CustomEvent('post-created', { detail: postCreated, bubbles: true }))
    } catch (err) {
      if (err instanceof Error) {
        this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
      }
    }
  }
}

customElements.define('crew-post-form', CrewPostForm)
