interface UseCase<T, R> {
  execute(params: T): Promise<R>
}

interface UpdatePostNameParams {
  postId: string
  name: string
}

interface Post {
  id: string
  name: { value: string }
}

export class CrewEditPostNameForm extends HTMLElement {
  #useCase: UseCase<UpdatePostNameParams, Post> | null = null
  #postId: string | null = null

  set updatePostNameUseCase(uc: UseCase<UpdatePostNameParams, Post> | null) { this.#useCase = uc }

  connectedCallback() {
    this.hidden = true
    this.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Nom du poste" required />
        <button type="submit">Renommer</button>
        <button type="button" data-action="cancel">Annuler</button>
      </form>
    `
    this.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement
      if (target.closest('button[data-action="cancel"]')) this.#close()
    })
    const form = this.querySelector<HTMLFormElement>('form')
    if (form) {
      form.addEventListener('submit', (e: Event) => this.#onSubmit(e))
    }
  }

  open({ postId, name }: { postId: string, name: string }): void {
    this.#postId = postId
    const nameInput = this.querySelector<HTMLInputElement>('input[name="name"]')
    if (nameInput) {
      nameInput.value = name
    }
    this.hidden = false
  }

  #close(): void { this.hidden = true }

  async #onSubmit(e: Event) {
    e.preventDefault()
    const nameInput = this.querySelector<HTMLInputElement>('[name="name"]')
    if (!nameInput || !this.#useCase || !this.#postId) return
    
    const name = nameInput.value.trim()
    try {
      await this.#useCase.execute({ postId: this.#postId, name })
      this.dispatchEvent(new CustomEvent('post-name-updated', {
        detail: { postId: this.#postId, name },
        bubbles: true
      }))
      this.#close()
    } catch (err) {
      const error = err as Error
      this.dispatchEvent(new CustomEvent<{ message: string }>('crew-error', { detail: { message: error.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-edit-post-name-form', CrewEditPostNameForm)
