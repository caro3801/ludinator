interface Registration {
  id: string
  personName: string
  waitlisted: boolean
}

interface RegisterEntryUseCase {
  execute(params: { activityId: string; slotId: string; personName: string }): Promise<Registration>
}

interface CancelRegistrationUseCase {
  execute(params: { activityId: string; slotId: string; registrationId: string }): Promise<unknown>
}

export class FestEntryForm extends HTMLElement {
  #registerUseCase: RegisterEntryUseCase | null = null
  #cancelUseCase: CancelRegistrationUseCase | null = null
  #activityId: string | null = null
  #slotId: string | null = null
  #registrations: Registration[] = []

  set registerEntryUseCase(uc: RegisterEntryUseCase) { this.#registerUseCase = uc }
  set cancelRegistrationUseCase(uc: CancelRegistrationUseCase) { this.#cancelUseCase = uc }

  connectedCallback(): void {
    this.addEventListener('click', (e: Event) => {
      const target: HTMLElement | null = e.target as HTMLElement | null
      if (target?.closest('button[data-action="cancel"]')) {
        this.hidden = true
        return
      }
      const delBtn = target?.closest('button[data-action="cancel-registration"]')
      if (delBtn) this.#onDelete((delBtn as HTMLElement).dataset.registrationId ?? '')
    })
    this.#renderShell()
  }

  open({ activityId, slotId, registrations }: { activityId: string; slotId: string; registrations: Registration[] }): void {
    this.#activityId = activityId
    this.#slotId = slotId
    this.#registrations = [...registrations]
    this.#renderShell()
    this.hidden = false
  }

  #renderShell(): void {
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
    const form: HTMLFormElement | null = this.querySelector('form')
    if (form) form.addEventListener('submit', (e: Event) => this.#onSubmit(e as SubmitEvent))
  }

  #renderList(): string {
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

  #updateList(): void {
    const div: HTMLElement | null = this.querySelector('div.mb-3')
    if (div) div.innerHTML = this.#renderList()
  }

  async #onDelete(registrationId: string): Promise<void> {
    try {
      if (!this.#cancelUseCase) return
      await this.#cancelUseCase.execute({
        activityId: this.#activityId ?? '',
        slotId: this.#slotId ?? '',
        registrationId,
      })
      this.#registrations = this.#registrations.filter(r => r.id !== registrationId)
      this.#updateList()
      this.dispatchEvent(new CustomEvent('registration-cancelled', {
        detail: { registrationId },
        bubbles: true,
      }))
    } catch (err) {
      this.#error(err instanceof Error ? err : new Error(String(err)))
    }
  }

  async #onSubmit(e: SubmitEvent): Promise<void> {
    e.preventDefault()
    const personName: string = this.querySelector<HTMLInputElement>('[name="personName"]')?.value.trim() ?? ''
    try {
      if (!this.#registerUseCase) return
      const reg: Registration = await this.#registerUseCase.execute({
        activityId: this.#activityId ?? '',
        slotId: this.#slotId ?? '',
        personName,
      })
      this.#registrations.push(reg)
      this.#updateList()
      const input: HTMLInputElement | null = this.querySelector('[name="personName"]')
      if (input) input.value = ''
      this.dispatchEvent(new CustomEvent('entry-registered', { detail: reg, bubbles: true }))
    } catch (err) {
      this.#error(err instanceof Error ? err : new Error(String(err)))
    }
  }

  #error(err: Error): void {
    this.dispatchEvent(new CustomEvent('fest-error', { detail: { message: err.message }, bubbles: true }))
  }
}

customElements.define('fest-entry-form', FestEntryForm)
