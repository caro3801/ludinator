export class CrewEditPostNameForm extends HTMLElement {
  #useCase = null
  #postId = null

  set updatePostNameUseCase(uc) { this.#useCase = uc }

  connectedCallback() {
    this.hidden = true
    this.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Nom du poste" required />
        <button type="submit">Renommer</button>
        <button type="button" data-action="cancel">Annuler</button>
      </form>
    `
    this.addEventListener('click', e => {
      if (e.target.closest('button[data-action="cancel"]')) this.#close()
    })
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  open({ postId, name }) {
    this.#postId = postId
    this.querySelector('input[name="name"]').value = name
    this.hidden = false
  }

  #close() { this.hidden = true }

  async #onSubmit(e) {
    e.preventDefault()
    const name = this.querySelector('[name="name"]').value.trim()
    try {
      const post = await this.#useCase.execute({ postId: this.#postId, name })
      this.dispatchEvent(new CustomEvent('post-name-updated', { detail: post, bubbles: true }))
      this.#close()
    } catch (err) {
      this.dispatchEvent(new CustomEvent('crew-error', { detail: { message: err.message }, bubbles: true }))
    }
  }
}

customElements.define('crew-edit-post-name-form', CrewEditPostNameForm)
