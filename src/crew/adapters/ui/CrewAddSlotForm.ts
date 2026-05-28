interface UseCase<T, R> {
  execute(params: T): Promise<R>
}

interface Post {
  id: string
  name: { value: string }
}

interface AddSlotParams {
  postId: string
  day: string
  startTime: string
  endTime: string
}

interface Slot {
  id: string
}

export class CrewAddSlotForm extends HTMLElement {
  #useCase: UseCase<AddSlotParams, Slot> | null = null
  #posts: Post[] = []
  #formData: { postId: string; day: string; startTime: string; endTime: string } = { postId: '', day: '', startTime: '', endTime: '' }

  set addSlotToPostUseCase(uc: UseCase<AddSlotParams, Slot> | null) { this.#useCase = uc }

  set posts(posts: Post[]) {
    this.#posts = posts
    this.#render()
    this.#restoreFormData()
  }

  connectedCallback() {
    this.#render()
  }

  #saveFormData(): void {
    const postSelect = this.querySelector<HTMLSelectElement>('[name="postId"]')
    const dayInput = this.querySelector<HTMLInputElement>('[name="day"]')
    const startTimeInput = this.querySelector<HTMLInputElement>('[name="startTime"]')
    const endTimeInput = this.querySelector<HTMLInputElement>('[name="endTime"]')
    
    if (postSelect && dayInput && startTimeInput && endTimeInput) {
      this.#formData = {
        postId: postSelect.value,
        day: dayInput.value,
        startTime: startTimeInput.value,
        endTime: endTimeInput.value,
      }
    }
  }

  #restoreFormData(): void {
    const postSelect = this.querySelector<HTMLSelectElement>('[name="postId"]')
    const dayInput = this.querySelector<HTMLInputElement>('[name="day"]')
    const startTimeInput = this.querySelector<HTMLInputElement>('[name="startTime"]')
    const endTimeInput = this.querySelector<HTMLInputElement>('[name="endTime"]')
    
    if (postSelect && dayInput && startTimeInput && endTimeInput) {
      postSelect.value = this.#formData.postId
      dayInput.value = this.#formData.day
      startTimeInput.value = this.#formData.startTime
      endTimeInput.value = this.#formData.endTime
    }
  }

  #render() {
    this.innerHTML = `
      <form>
        <select name="postId" required>
          ${this.#posts.map(p => `<option value="${p.id}">${p.name.value}</option>`).join('')}
        </select>
        <input type="text" name="day" placeholder="Jour (ex: samedi)" required />
        <input type="time" name="startTime" required />
        <input type="time" name="endTime" required />
        <button type="submit">Ajouter le créneau</button>
        <button type="reset" class="btn btn-outline-secondary ms-2">Effacer</button>
      </form>
    `
    const form = this.querySelector('form')
    if (form) {
      form.addEventListener('submit', (e: Event) => this.#onSubmit(e))
    }
  }

  async #onSubmit(e: Event) {
    e.preventDefault()
    const postSelect = this.querySelector<HTMLSelectElement>('[name="postId"]')
    const dayInput = this.querySelector<HTMLInputElement>('[name="day"]')
    const startTimeInput = this.querySelector<HTMLInputElement>('[name="startTime"]')
    const endTimeInput = this.querySelector<HTMLInputElement>('[name="endTime"]')
    
    if (!postSelect || !dayInput || !startTimeInput || !endTimeInput) return
    
    const postId = postSelect.value
    const day = dayInput.value.trim()
    const startTime = startTimeInput.value
    const endTime = endTimeInput.value
    
    if (!this.#useCase) return
    
    // Sauvegarder les données du formulaire avant soumission
    this.#saveFormData()
    
    try {
      await this.#useCase.execute({ postId, day, startTime, endTime })
      this.dispatchEvent(new CustomEvent('slot-added', {
        detail: { postId, day, startTime, endTime },
        bubbles: true
      }))
    } catch (err) {
      const error = err as Error
      this.dispatchEvent(new CustomEvent<{ message: string }>('crew-error', { detail: { message: error.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-add-slot-form', CrewAddSlotForm)
