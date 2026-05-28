interface UseCase<T, R> {
  execute(params: T): Promise<R>
}

interface VolunteerCreated {
  payload: { volunteer: { id: string; name: { value: string } } }
}

export class CrewVolunteerForm extends HTMLElement {
  #useCase: UseCase<{ name: string }, VolunteerCreated> | null = null
  #formData: { name: string } = { name: '' }

  set createVolunteerUseCase(uc: UseCase<{ name: string }, VolunteerCreated> | null) { this.#useCase = uc }

  connectedCallback() {
    this.#render()
  }

  #render() {
    this.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Nom du bénévole" required />
        <button type="submit">Ajouter</button>
        <button type="reset" class="btn btn-outline-secondary ms-2">Effacer</button>
      </form>
    `
    const form = this.querySelector('form')
    if (form) form.addEventListener('submit', e => this.#onSubmit(e))
    this.#restoreFormData()
  }

  #saveFormData(): void {
    const nameInput = this.querySelector<HTMLInputElement>('[name="name"]')
    if (nameInput) {
      this.#formData = { name: nameInput.value }
    }
  }

  #restoreFormData(): void {
    const nameInput = this.querySelector<HTMLInputElement>('[name="name"]')
    if (nameInput) {
      nameInput.value = this.#formData.name
    }
  }

  async #onSubmit(e: SubmitEvent) {
    e.preventDefault()
    const nameInput = this.querySelector<HTMLInputElement>('[name="name"]')
    if (!nameInput) return
    const name = nameInput.value.trim()
    if (!this.#useCase) return
    
    // Sauvegarder les données du formulaire avant soumission
    this.#saveFormData()
    
    try {
      const volunteerCreated = await this.#useCase.execute({ name })
      this.dispatchEvent(new CustomEvent('volunteer-created', { detail: volunteerCreated, bubbles: true }))
    } catch (err) {
      if (err instanceof Error) {
        this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
      }
    }
  }
}

customElements.define('crew-volunteer-form', CrewVolunteerForm)
