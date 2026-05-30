interface UseCase<T, R> {
  execute(params: T): Promise<R>
}

interface UpdateVolunteerNameParams {
  volunteerId: string
  name: string
}

interface Volunteer {
  id: string
  name: { value: string }
}

interface OpenParams {
  volunteerId: string
  name: string
}

export class CrewEditVolunteerNameForm extends HTMLElement {
  #useCase: UseCase<UpdateVolunteerNameParams, Volunteer> | null = null
  #volunteerId: string | null = null

  set updateVolunteerNameUseCase(uc: UseCase<UpdateVolunteerNameParams, Volunteer> | null) { this.#useCase = uc }

  connectedCallback() {
    this.hidden = true
    this.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Nom du bénévole" required />
        <button type="submit">Renommer</button>
        <button type="button" data-action="cancel">Annuler</button>
      </form>
    `
    this.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement
      if (target.closest('button[data-action="cancel"]')) this.hidden = true
    })
    const form = this.querySelector<HTMLFormElement>('form')
    if (form) {
      form.addEventListener('submit', (e: Event) => this.#onSubmit(e))
    }
  }

  open({ volunteerId, name }: OpenParams): void {
    this.#volunteerId = volunteerId
    const nameInput = this.querySelector<HTMLInputElement>('input[name="name"]')
    if (nameInput) {
      nameInput.value = name
    }
    this.hidden = false
  }

  async #onSubmit(e: Event) {
    e.preventDefault()
    const nameInput = this.querySelector<HTMLInputElement>('[name="name"]')
    if (!nameInput || !this.#useCase || !this.#volunteerId) return
    
    const name = nameInput.value.trim()
    try {
      await this.#useCase.execute({ volunteerId: this.#volunteerId, name })
      this.dispatchEvent(new CustomEvent('volunteer-name-updated', {
        detail: { volunteerId: this.#volunteerId, name },
        bubbles: true
      }))
      this.hidden = true
    } catch (err) {
      const error = err as Error
      this.dispatchEvent(new CustomEvent<{ message: string }>('crew-error', { detail: { message: error.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-edit-volunteer-name-form', CrewEditVolunteerNameForm)
