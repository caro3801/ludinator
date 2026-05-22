export class CrewAssignForm extends HTMLElement {
  #useCase = null
  #volunteers = []
  #posts = []
  #editionId = null

  set assignVolunteerUseCase(uc) { this.#useCase = uc }
  set editionId(id) { this.#editionId = id }

  set volunteers(list) {
    this.#volunteers = list
    this.#render()
  }

  set posts(list) {
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
    this.querySelector('select[name="postId"]').addEventListener('change', e => {
      this.querySelector('select[name="slotId"]').innerHTML = this.#slotsFor(e.target.value)
    })
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  #slotsFor(postId) {
    const post = this.#posts.find(p => p.id === postId)
    if (!post?.slots?.length) return ''
    return post.slots.map(s =>
      `<option value="${s.id}">${s.window.day} ${s.window.startTime}–${s.window.endTime}</option>`
    ).join('')
  }

  selectSlot({ postId, slotId }) {
    const postSelect = this.querySelector('select[name="postId"]')
    postSelect.value = postId
    postSelect.dispatchEvent(new Event('change'))
    this.querySelector('select[name="slotId"]').value = slotId
  }

  async #onSubmit(e) {
    e.preventDefault()
    const volunteerId = this.querySelector('[name="volunteerId"]').value
    const slotId = this.querySelector('[name="slotId"]').value
    try {
      const assignment = await this.#useCase.execute({ volunteerId, slotId, editionId: this.#editionId })
      this.dispatchEvent(new CustomEvent('volunteer-assigned', { detail: assignment, bubbles: true }))
    } catch (err) {
      this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-assign-form', CrewAssignForm)
