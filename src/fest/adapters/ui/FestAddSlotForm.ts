interface AddSlotUseCase {
  execute(params: { activityId: string; day: string; startTime: string; endTime: string; min: number | null; max: number | null }): Promise<unknown>
}

interface ActivityOption {
  id: string
  name: { value: string }
}

export class FestAddSlotForm extends HTMLElement {
  #useCase: AddSlotUseCase | null = null
  #activities: ActivityOption[] = []

  set addSlotToActivityUseCase(uc: AddSlotUseCase) { this.#useCase = uc }

  set activities(list: ActivityOption[]) {
    this.#activities = list
    this.#render()
  }

  connectedCallback(): void { this.#render() }

  #render(): void {
    this.innerHTML = `
      <form>
        <div class="mb-2">
          <select class="form-select form-select-sm" name="activityId" required>
            ${this.#activities.map(a => `<option value="${a.id}">${a.name.value}</option>`).join('')}
          </select>
        </div>
        <div class="row g-2 mb-2">
          <div class="col">
            <input class="form-control form-control-sm" type="text" name="day" placeholder="Jour (ex: saturday)" required />
          </div>
          <div class="col">
            <input class="form-control form-control-sm" type="time" name="startTime" required />
          </div>
          <div class="col">
            <input class="form-control form-control-sm" type="time" name="endTime" required />
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col">
            <input class="form-control form-control-sm" type="number" name="min" placeholder="Min participants" min="0" />
          </div>
          <div class="col">
            <input class="form-control form-control-sm" type="number" name="max" placeholder="Max participants" min="0" />
          </div>
        </div>
        <button class="btn btn-primary btn-sm" type="submit">Ajouter le créneau</button>
      </form>
    `
    const form = this.querySelector('form')
    if (form) form.addEventListener('submit', (e: Event) => this.#onSubmit(e as SubmitEvent))
  }

  async #onSubmit(e: SubmitEvent): Promise<void> {
    e.preventDefault()
    const activityId = (this.querySelector<HTMLSelectElement>('[name="activityId"]'))?.value ?? ''
    const day = (this.querySelector<HTMLInputElement>('[name="day"]'))?.value.trim() ?? ''
    const startTime = (this.querySelector<HTMLInputElement>('[name="startTime"]'))?.value ?? ''
    const endTime = (this.querySelector<HTMLInputElement>('[name="endTime"]'))?.value ?? ''
    const minRaw = (this.querySelector<HTMLInputElement>('[name="min"]'))?.value
    const maxRaw = (this.querySelector<HTMLInputElement>('[name="max"]'))?.value
    const min = minRaw ? parseInt(minRaw, 10) : null
    const max = maxRaw ? parseInt(maxRaw, 10) : null
    if (!this.#useCase) return
    try {
      const slot = await this.#useCase.execute({ activityId, day, startTime, endTime, min, max })
      this.dispatchEvent(new CustomEvent('slot-added-to-activity', { detail: slot, bubbles: true }))
      this.querySelector('form')?.reset()
    } catch (err) {
      this.dispatchEvent(new CustomEvent('fest-error', { detail: { message: err instanceof Error ? err.message : String(err) }, bubbles: true }))
    }
  }
}

customElements.define('fest-add-slot-form', FestAddSlotForm)
