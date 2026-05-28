interface UseCase<T, R> {
  execute(params: T): Promise<R>
}

interface Volunteer {
  id: string
  name: { value: string }
}

interface Post {
  id: string
  name: { value: string }
  slots: { id: string, window: { day: string, startTime: string, endTime: string } }[]
}

interface AssignmentParams {
  volunteerId: string
  slotId: string
  editionId: string | null
}

interface Assignment {
  id: string
}

export class CrewAssignForm extends HTMLElement {
  #useCase: UseCase<AssignmentParams, Assignment> | null = null
  #volunteers: Volunteer[] = []
  #posts: Post[] = []
  #editionId: string | null = null

  set assignVolunteerUseCase(uc: UseCase<AssignmentParams, Assignment> | null) { this.#useCase = uc }
  set editionId(id: string | null) { this.#editionId = id }

  set volunteers(list: Volunteer[]) {
    this.#volunteers = list
    this.#render()
  }

  set posts(list: Post[]) {
    this.#posts = list
    this.#render()
  }

  connectedCallback() { this.#render() }

  #render() {
    const firstPost = this.#posts[0]
    this.innerHTML = `
      <form>
        <select name="volunteerId" required>
          ${this.#volunteers.map(v => `<option value="${v.id}">${v.name.value}</option>`).join('')}
        </select>
        <select name="postId" required>
          ${this.#posts.map(p => `<option value="${p.id}">${p.name.value}</option>`).join('')}
        </select>
        <select name="slotId" required>
          ${this.#slotsFor(firstPost?.id)}
        </select>
        <button type="submit">Affecter</button>
      </form>
    `
    const postSelect = this.querySelector<HTMLSelectElement>('select[name="postId"]')
    const slotSelect = this.querySelector<HTMLSelectElement>('select[name="slotId"]')
    const form = this.querySelector<HTMLFormElement>('form')
    
    if (postSelect && slotSelect) {
      postSelect.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLSelectElement
        if (slotSelect) {
          slotSelect.innerHTML = this.#slotsFor(target.value)
        }
      })
    }
    if (form) {
      form.addEventListener('submit', (e: Event) => this.#onSubmit(e))
    }
  }

  #slotsFor(postId: string | undefined): string {
    const post = this.#posts.find(p => p.id === postId)
    if (!post?.slots?.length) return ''
    return post.slots.map(s =>
      `<option value="${s.id}">${s.window.day} ${s.window.startTime}–${s.window.endTime}</option>`
    ).join('')
  }

  selectSlot({ postId, slotId }: { postId: string, slotId: string }): void {
    const postSelect = this.querySelector<HTMLSelectElement>('select[name="postId"]')
    if (postSelect) {
      postSelect.value = postId
      postSelect.dispatchEvent(new Event('change'))
    }
    const slotSelect = this.querySelector<HTMLSelectElement>('select[name="slotId"]')
    if (slotSelect) {
      slotSelect.value = slotId
    }
  }

  async #onSubmit(e: Event) {
    e.preventDefault()
    const volunteerSelect = this.querySelector<HTMLSelectElement>('[name="volunteerId"]')
    const slotSelect = this.querySelector<HTMLSelectElement>('[name="slotId"]')
    
    if (!volunteerSelect || !slotSelect) return
    
    const volunteerId = volunteerSelect.value
    const slotId = slotSelect.value
    
    if (!this.#useCase) return
    
    try {
      await this.#useCase.execute({ volunteerId, slotId, editionId: this.#editionId })
      this.dispatchEvent(new CustomEvent('volunteer-assigned', {
        detail: { volunteerId, slotId },
        bubbles: true
      }))
    } catch (err) {
      const error = err as Error
      this.dispatchEvent(new CustomEvent<{ message: string }>('crew-error', { detail: { message: error.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-assign-form', CrewAssignForm)
