export class CrewAddSlotForm extends HTMLElement {
  #useCase = null
  #posts = []

  set addSlotToPostUseCase(uc) { this.#useCase = uc }

  set posts(posts) {
    this.#posts = posts
    this.#render()
  }

  connectedCallback() {
    this.#render()
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
      </form>
    `
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  async #onSubmit(e) {
    e.preventDefault()
    const postId = this.querySelector('[name="postId"]').value
    const day = this.querySelector('[name="day"]').value.trim()
    const startTime = this.querySelector('[name="startTime"]').value
    const endTime = this.querySelector('[name="endTime"]').value
    try {
      const slot = await this.#useCase.execute({ postId, day, startTime, endTime })
      this.dispatchEvent(new CustomEvent('slot-added', { detail: slot, bubbles: true }))
      e.target.reset()
    } catch (err) {
      this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-add-slot-form', CrewAddSlotForm)
