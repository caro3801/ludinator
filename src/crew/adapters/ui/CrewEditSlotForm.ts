export class CrewEditSlotForm extends HTMLElement {
  #useCase = null
  #postId = null
  #slotId = null

  set updateSlotInPostUseCase(uc) { this.#useCase = uc }

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
    this.addEventListener('click', e => {
      if (e.target.closest('button[data-action="cancel"]')) this.#close()
    })
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  open({ postId, slot }) {
    this.#postId = postId
    this.#slotId = slot.id
    this.querySelector('input[name="day"]').value = slot.window.day
    this.querySelector('input[name="startTime"]').value = slot.window.startTime
    this.querySelector('input[name="endTime"]').value = slot.window.endTime
    this.hidden = false
  }

  #close() { this.hidden = true }

  async #onSubmit(e) {
    e.preventDefault()
    const day = this.querySelector('[name="day"]').value.trim()
    const startTime = this.querySelector('[name="startTime"]').value
    const endTime = this.querySelector('[name="endTime"]').value
    try {
      const slot = await this.#useCase.execute({ postId: this.#postId, slotId: this.#slotId, day, startTime, endTime })
      this.dispatchEvent(new CustomEvent('slot-updated', { detail: slot, bubbles: true }))
      this.#close()
    } catch (err) {
      this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-edit-slot-form', CrewEditSlotForm)
