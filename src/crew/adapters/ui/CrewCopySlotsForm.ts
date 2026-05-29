interface UseCase<T, R> {
  execute(params: T): Promise<R>
}

interface CopySlotsToPostParams {
  sourcePostId: string
  targetPostId: string
}

interface Post {
  id: string
  name: { value: string }
}

export class CrewCopySlotsForm extends HTMLElement {
  #useCase: UseCase<CopySlotsToPostParams, { payload: { sourcePost: Post; targetPost: Post; copiedSlotCount: number } }> | null = null
  #sourcePostId: string | null = null
  #posts: Post[] = []

  set copySlotsToPostUseCase(uc: UseCase<CopySlotsToPostParams, { payload: { sourcePost: Post; targetPost: Post; copiedSlotCount: number } }> | null) {
    this.#useCase = uc
  }

  set posts(posts: Post[]) {
    this.#posts = posts
  }

  get posts(): Post[] {
    return this.#posts
  }

  connectedCallback() {
    this.hidden = true
    this.innerHTML = `
      <form>
        <div class="mb-2">
          <label class="form-label">Poste destination:</label>
          <select name="targetPostId" class="form-select" required>
            <option value="">-- Sélectionner un poste --</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Copier les créneaux</button>
        <button type="button" class="btn btn-outline-secondary ms-2" data-action="cancel">Annuler</button>
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

  open({ sourcePostId }: { sourcePostId: string }): void {
    this.#sourcePostId = sourcePostId
    
    const select = this.querySelector<HTMLSelectElement>('select[name="targetPostId"]')
    if (select) {
      select.innerHTML = '<option value="">-- Sélectionner un poste --</option>'
      for (const post of this.#posts) {
        if (post.id !== sourcePostId) {
          select.innerHTML += `<option value="${post.id}">${post.name.value}</option>`
        }
      }
    }
    this.hidden = false
  }

  #close(): void { this.hidden = true }

  async #onSubmit(e: Event) {
    e.preventDefault()
    const select = this.querySelector<HTMLSelectElement>('select[name="targetPostId"]')
    if (!select || !this.#useCase || !this.#sourcePostId) return
    
    const targetPostId = select.value
    if (!targetPostId) return
    
    try {
      const result = await this.#useCase.execute({ sourcePostId: this.#sourcePostId, targetPostId })
      this.dispatchEvent(new CustomEvent('slots-copied', { 
        detail: { sourcePostId: this.#sourcePostId, targetPostId },
        bubbles: true 
      }))
      this.#close()
    } catch (err) {
      const error = err as Error
      this.dispatchEvent(new CustomEvent('crew-error', { 
        detail: { message: error.message }, 
        bubbles: true 
      }))
    }
  }
}

customElements.define('crew-copy-slots-form', CrewCopySlotsForm)
