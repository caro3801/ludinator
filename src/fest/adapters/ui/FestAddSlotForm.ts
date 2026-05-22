export class FestAddSlotForm extends HTMLElement {
  #useCase = null
  #activities = []

  set addSlotToActivityUseCase(uc) { this.#useCase = uc }

  set activities(list) {
    this.#activities = list
    this.#render()
  }

  connectedCallback() { this.#render() }

  #render() {
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
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  async #onSubmit(e) {
    e.preventDefault()
    const activityId = this.querySelector('[name="activityId"]').value
    const day = this.querySelector('[name="day"]').value.trim()
    const startTime = this.querySelector('[name="startTime"]').value
    const endTime = this.querySelector('[name="endTime"]').value
    const minRaw = this.querySelector('[name="min"]').value
    const maxRaw = this.querySelector('[name="max"]').value
    const min = minRaw ? parseInt(minRaw, 10) : null
    const max = maxRaw ? parseInt(maxRaw, 10) : null
    try {
      const slot = await this.#useCase.execute({ activityId, day, startTime, endTime, min, max })
      this.dispatchEvent(new CustomEvent('slot-added-to-activity', { detail: slot, bubbles: true }))
      this.querySelector('form').reset()
    } catch (err) {
      this.dispatchEvent(new CustomEvent('fest-error', { detail: { message: err.message }, bubbles: true }))
    }
  }
}

customElements.define('fest-add-slot-form', FestAddSlotForm)
