interface UseCase<T, R> {
  execute(params: T): Promise<R>
}

interface Slot {
  id: string
  window: { day: string, startTime: string, endTime: string }
}

interface UpdateSlotParams {
  postId: string
  slotId: string
  day: string
  startTime: string
  endTime: string
}

interface OpenSlotParams {
  postId: string
  slot: Slot
}

export class CrewEditSlotForm extends HTMLElement {
  #useCase: UseCase<UpdateSlotParams, Slot> | null = null
  #postId: string | null = null
  #slotId: string | null = null

  set updateSlotInPostUseCase(uc: UseCase<UpdateSlotParams, Slot> | null) { this.#useCase = uc }

  connectedCallback() {
    this.hidden = true
    this.innerHTML = `
      <form>
        <input type="text" name="day" placeholder="Jour" required />
        <input type="time" name="startTime" required />
        <input type="time" name="endTime" required />
        <button type="submit">Modifier</button>
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

  open({ postId, slot }: OpenSlotParams): void {
    this.#postId = postId
    this.#slotId = slot.id
    const dayInput = this.querySelector<HTMLInputElement>('input[name="day"]')
    const startTimeInput = this.querySelector<HTMLInputElement>('input[name="startTime"]')
    const endTimeInput = this.querySelector<HTMLInputElement>('input[name="endTime"]')
    
    if (dayInput && startTimeInput && endTimeInput) {
      dayInput.value = slot.window.day
      startTimeInput.value = slot.window.startTime
      endTimeInput.value = slot.window.endTime
    }
    this.hidden = false
  }

  #close(): void { this.hidden = true }

  async #onSubmit(e: Event) {
    e.preventDefault()
    const dayInput = this.querySelector<HTMLInputElement>('[name="day"]')
    const startTimeInput = this.querySelector<HTMLInputElement>('[name="startTime"]')
    const endTimeInput = this.querySelector<HTMLInputElement>('[name="endTime"]')
    
    if (!dayInput || !startTimeInput || !endTimeInput || !this.#useCase || !this.#postId || !this.#slotId) return
    
    const day = dayInput.value.trim()
    const startTime = startTimeInput.value
    const endTime = endTimeInput.value
    try {
      await this.#useCase.execute({ postId: this.#postId, slotId: this.#slotId, day, startTime, endTime })
      this.dispatchEvent(new CustomEvent('slot-updated', {
        detail: { postId: this.#postId, slotId: this.#slotId, day, startTime, endTime },
        bubbles: true
      }))
      this.#close()
    } catch (err) {
      const error = err as Error
      this.dispatchEvent(new CustomEvent<{ message: string }>('crew-error', { detail: { message: error.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-edit-slot-form', CrewEditSlotForm)
