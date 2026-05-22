export class FestEntryForm extends HTMLElement {
  #registerUseCase = null
  #cancelUseCase = null
  #activityId = null
  #slotId = null
  #registrations = []

  set registerEntryUseCase(uc) { this.#registerUseCase = uc }
  set cancelRegistrationUseCase(uc) { this.#cancelUseCase = uc }

  connectedCallback() {
    this.addEventListener('click', e => {
      if (e.target.closest('button[data-action="cancel"]')) {
        this.hidden = true
        return
      }
      const delBtn = e.target.closest('button[data-action="cancel-registration"]')
      if (delBtn) this.#onDelete(delBtn.dataset.registrationId)
    })
    this.#renderShell()
  }

  open({ activityId, slotId, registrations }) {
    this.#activityId = activityId
    this.#slotId = slotId
    this.#registrations = [...registrations]
    this.#renderShell()
    this.hidden = false
  }

  #renderShell() {
    this.innerHTML = `
      <div class="mb-3">
        ${this.#renderList()}
      </div>
      <form>
        <div class="mb-2">
          <input class="form-control form-control-sm" type="text" name="personName" placeholder="Nom de la personne" required />
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm" type="submit">Inscrire</button>
          <button class="btn btn-secondary btn-sm" type="button" data-action="cancel">Fermer</button>
        </div>
      </form>
    `
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  #renderList() {
    if (!this.#registrations.length) return '<p class="text-muted small mb-0">Aucune inscription.</p>'
    return `<ul class="list-group list-group-flush">
      ${this.#registrations.map(r => `
        <li class="list-group-item d-flex align-items-center justify-content-between py-1 px-0 small">
          <span>
            ${r.personName}
            ${r.waitlisted ? '<span class="badge bg-warning text-dark ms-1" data-waitlisted>liste d\'attente</span>' : ''}
          </span>
          <button class="btn btn-outline-danger btn-sm py-0 px-1"
            data-action="cancel-registration"
            data-registration-id="${r.id}">✕</button>
        </li>
      `).join('')}
    </ul>`
  }

  #updateList() {
    this.querySelector('div.mb-3').innerHTML = this.#renderList()
  }

  async #onDelete(registrationId) {
    try {
      await this.#cancelUseCase.execute({
        activityId: this.#activityId,
        slotId: this.#slotId,
        registrationId,
      })
      this.#registrations = this.#registrations.filter(r => r.id !== registrationId)
      this.#updateList()
      this.dispatchEvent(new CustomEvent('registration-cancelled', {
        detail: { registrationId },
        bubbles: true,
      }))
    } catch (err) {
      this.#error(err)
    }
  }

  async #onSubmit(e) {
    e.preventDefault()
    const personName = this.querySelector('[name="personName"]').value.trim()
    try {
      const reg = await this.#registerUseCase.execute({
        activityId: this.#activityId,
        slotId: this.#slotId,
        personName,
      })
      this.#registrations.push(reg)
      this.#updateList()
      this.querySelector('[name="personName"]').value = ''
      this.dispatchEvent(new CustomEvent('entry-registered', { detail: reg, bubbles: true }))
    } catch (err) {
      this.#error(err)
    }
  }

  #error(err) {
    this.dispatchEvent(new CustomEvent('fest-error', { detail: { message: err.message }, bubbles: true }))
  }
}

customElements.define('fest-entry-form', FestEntryForm)
