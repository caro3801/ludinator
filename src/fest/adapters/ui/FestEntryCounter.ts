interface SubCounterBatch {
  id: string
  timestamp: number
  adults: number
  children: number
  families: number
}

interface SubCounterData {
  id: string
  label: string
  total: number
  totalAdults: number
  totalChildren: number
  batches: SubCounterBatch[]
}

interface EntryLogLike {
  totalAdults: number
  totalChildren: number
  totalFamilies: number
  total: number
  subCounters: SubCounterData[]
}

interface AddSubCounterUseCase {
  execute(params: { editionId: string; label: string }): Promise<unknown>
}
interface RemoveSubCounterUseCase {
  execute(params: { editionId: string; subCounterId: string }): Promise<unknown>
}
interface RecordSubCounterEntriesUseCase {
  execute(params: { editionId: string; subCounterId: string; adults: number; children: number; families: number }): Promise<unknown>
}
interface UpdateSubCounterBatchUseCase {
  execute(params: { editionId: string; subCounterId: string; batchId: string; adults: number; children: number; families: number }): Promise<unknown>
}
interface DeleteSubCounterBatchUseCase {
  execute(params: { editionId: string; subCounterId: string; batchId: string }): Promise<unknown>
}

export class FestEntryCounter extends HTMLElement {
  #addScUseCase: AddSubCounterUseCase | null = null
  #removeScUseCase: RemoveSubCounterUseCase | null = null
  #recordScUseCase: RecordSubCounterEntriesUseCase | null = null
  #updateScUseCase: UpdateSubCounterBatchUseCase | null = null
  #deleteScUseCase: DeleteSubCounterBatchUseCase | null = null
  #editionId: string | null = null

  set addSubCounterUseCase(uc: AddSubCounterUseCase) { this.#addScUseCase = uc }
  set removeSubCounterUseCase(uc: RemoveSubCounterUseCase) { this.#removeScUseCase = uc }
  set recordSubCounterEntriesUseCase(uc: RecordSubCounterEntriesUseCase) { this.#recordScUseCase = uc }
  set updateSubCounterBatchUseCase(uc: UpdateSubCounterBatchUseCase) { this.#updateScUseCase = uc }
  set deleteSubCounterBatchUseCase(uc: DeleteSubCounterBatchUseCase) { this.#deleteScUseCase = uc }
  set editionId(id: string) { this.#editionId = id }

  connectedCallback(): void {
    this.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement | null
      const delSc = target?.closest('button[data-action="delete-sc-batch"]')
      if (delSc) {
        const { batchId, scId } = (delSc as HTMLElement).dataset
        if (!this.#deleteScUseCase || !this.#editionId || !scId || !batchId) return
        this.#deleteScUseCase.execute({ editionId: this.#editionId, subCounterId: scId, batchId })
          .then(() => this.#updated())
          .catch((err: unknown) => this.#error(err instanceof Error ? err : new Error(String(err))))
        return
      }

      const removeSc = target?.closest('button[data-action="remove-sub-counter"]')
      if (removeSc) {
        const { scId } = (removeSc as HTMLElement).dataset
        if (!this.#removeScUseCase || !this.#editionId || !scId) return
        this.#removeScUseCase.execute({ editionId: this.#editionId, subCounterId: scId })
          .then(() => this.#updated())
          .catch((err: unknown) => this.#error(err instanceof Error ? err : new Error(String(err))))
        return
      }

      const addSc = target?.closest('button[data-action="add-sub-counter"]')
      if (addSc) {
        const label: string | null = prompt('Nom du sous-compteur :')
        if (!label?.trim()) return
        if (!this.#addScUseCase || !this.#editionId) return
        this.#addScUseCase.execute({ editionId: this.#editionId, label: label.trim() })
          .then(() => this.#updated())
          .catch((err: unknown) => this.#error(err instanceof Error ? err : new Error(String(err))))
      }
    })

    this.addEventListener('submit', (e: Event) => {
      const form: HTMLFormElement | null = e.target as HTMLFormElement | null
      if (!form) return
      e.preventDefault()
      const adults: number = parseInt(form.querySelector<HTMLInputElement>('[name="adults"]')?.value ?? '0', 10) || 0
      const children: number = parseInt(form.querySelector<HTMLInputElement>('[name="children"]')?.value ?? '0', 10) || 0
      const families: number = parseInt(form.querySelector<HTMLInputElement>('[name="families"]')?.value ?? '0', 10) || 0
      const batchId: string | undefined = form.dataset.batchId
      const scId: string | undefined = form.closest<HTMLElement>('[data-sc-id]')?.dataset?.scId

      if (!scId || !this.#editionId) return

      if (batchId) {
        if (!this.#updateScUseCase) return
        this.#updateScUseCase.execute({ editionId: this.#editionId, subCounterId: scId, batchId, adults, children, families })
          .then(() => this.#updated())
          .catch((err: unknown) => this.#error(err instanceof Error ? err : new Error(String(err))))
      } else {
        if (!this.#recordScUseCase) return
        this.#recordScUseCase.execute({ editionId: this.#editionId, subCounterId: scId, adults, children, families })
          .then(() => { form.reset(); this.#updated() })
          .catch((err: unknown) => this.#error(err instanceof Error ? err : new Error(String(err))))
      }
    })
  }

  refresh(log: EntryLogLike | null): void {
    const totalAdults: number = log?.totalAdults ?? 0
    const totalChildren: number = log?.totalChildren ?? 0
    const totalFamilies: number = log?.totalFamilies ?? 0
    const total: number = log?.total ?? 0
    const subCounters: SubCounterData[] = log?.subCounters ?? []

    this.innerHTML = `
      <div class="mb-3 p-3 bg-light rounded d-flex gap-4 text-center">
        <div><div class="fs-4 fw-bold" data-total>${total}</div><div class="small text-muted">Total</div></div>
        <div><div class="fs-4 fw-bold" data-total-adults>${totalAdults}</div><div class="small text-muted">Adultes</div></div>
        <div><div class="fs-4 fw-bold" data-total-children>${totalChildren}</div><div class="small text-muted">Enfants</div></div>
        <div><div class="fs-4 fw-bold">${totalFamilies}</div><div class="small text-muted">Familles</div></div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="fw-semibold small text-secondary text-uppercase">Sous-compteurs</span>
        <button class="btn btn-outline-secondary btn-sm" data-action="add-sub-counter">+ Ajouter</button>
      </div>
      ${subCounters.length
        ? subCounters.map(sc => this.#renderSubCounter(sc)).join('')
        : '<p class="text-muted small">Aucun sous-compteur. Ajoutez-en un pour commencer.</p>'
      }
    `
  }

  #renderSubCounter(sc: SubCounterData): string {
    return `
      <div class="border rounded p-2 mb-2" data-sc-id="${sc.id}">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="fw-semibold">${sc.label}</span>
          <div class="d-flex align-items-center gap-3">
            <span class="small text-muted">
              <span data-sc-total>${sc.total}</span> entrées
              (${sc.totalAdults} adultes, ${sc.totalChildren} enfants)
            </span>
            <button class="btn btn-outline-danger btn-sm py-0 px-2" type="button"
              data-action="remove-sub-counter" data-sc-id="${sc.id}">✕</button>
          </div>
        </div>
        <form class="d-flex gap-2 mb-2 align-items-end" data-add-form>
          <div class="flex-fill">
            <label class="form-label small mb-1">Adultes</label>
            <input class="form-control form-control-sm" type="number" name="adults" value="0" min="0" />
          </div>
          <div class="flex-fill">
            <label class="form-label small mb-1">Enfants</label>
            <input class="form-control form-control-sm" type="number" name="children" value="0" min="0" />
          </div>
          <div class="flex-fill">
            <label class="form-label small mb-1">Familles</label>
            <input class="form-control form-control-sm" type="number" name="families" value="0" min="0" />
          </div>
          <div><button class="btn btn-primary btn-sm" type="submit">+ Entrées</button></div>
        </form>
        ${this.#renderBatchList(sc.batches, sc.id)}
      </div>
    `
  }

  #renderBatchList(batches: SubCounterBatch[], scId: string): string {
    if (!batches.length) return '<p class="text-muted small">Aucune entrée enregistrée.</p>'
    return `
      <div class="d-flex flex-column gap-2 mb-2">
        ${[...batches].reverse().map(b => `
          <form class="d-flex gap-2 align-items-center" data-batch-id="${b.id}">
            <span class="text-muted small text-nowrap">${this.#fmtTime(b.timestamp)}</span>
            <input class="form-control form-control-sm" type="number" name="adults" value="${b.adults}" min="0" />
            <input class="form-control form-control-sm" type="number" name="children" value="${b.children}" min="0" />
            <input class="form-control form-control-sm" type="number" name="families" value="${b.families}" min="0" />
            <button class="btn btn-outline-secondary btn-sm py-0 px-2" type="submit">✓</button>
            <button class="btn btn-outline-danger btn-sm py-0 px-2" type="button"
              data-action="delete-sc-batch" data-batch-id="${b.id}" data-sc-id="${scId}">🗑</button>
          </form>
        `).join('')}
      </div>
    `
  }

  #fmtTime(ts: number): string {
    const d: Date = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  #updated(): void {
    this.dispatchEvent(new CustomEvent('entries-updated', { bubbles: true }))
  }

  #error(err: Error): void {
    this.dispatchEvent(new CustomEvent('fest-error', { detail: { message: err.message }, bubbles: true }))
  }
}

customElements.define('fest-entry-counter', FestEntryCounter)
