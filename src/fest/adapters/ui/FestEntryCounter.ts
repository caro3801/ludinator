export class FestEntryCounter extends HTMLElement {
  #addScUseCase = null
  #removeScUseCase = null
  #recordScUseCase = null
  #updateScUseCase = null
  #deleteScUseCase = null
  #editionId = null

  set addSubCounterUseCase(uc) { this.#addScUseCase = uc }
  set removeSubCounterUseCase(uc) { this.#removeScUseCase = uc }
  set recordSubCounterEntriesUseCase(uc) { this.#recordScUseCase = uc }
  set updateSubCounterBatchUseCase(uc) { this.#updateScUseCase = uc }
  set deleteSubCounterBatchUseCase(uc) { this.#deleteScUseCase = uc }
  set editionId(id) { this.#editionId = id }

  connectedCallback() {
    this.addEventListener('click', e => {
      const delSc = e.target.closest('button[data-action="delete-sc-batch"]')
      if (delSc) {
        this.#deleteScUseCase.execute({
          editionId: this.#editionId, subCounterId: delSc.dataset.scId, batchId: delSc.dataset.batchId,
        })
          .then(() => this.#updated())
          .catch(err => this.#error(err))
        return
      }

      const removeSc = e.target.closest('button[data-action="remove-sub-counter"]')
      if (removeSc) {
        this.#removeScUseCase.execute({ editionId: this.#editionId, subCounterId: removeSc.dataset.scId })
          .then(() => this.#updated())
          .catch(err => this.#error(err))
        return
      }

      const addSc = e.target.closest('button[data-action="add-sub-counter"]')
      if (addSc) {
        const label = prompt('Nom du sous-compteur :')
        if (!label?.trim()) return
        this.#addScUseCase.execute({ editionId: this.#editionId, label: label.trim() })
          .then(() => this.#updated())
          .catch(err => this.#error(err))
      }
    })

    this.addEventListener('submit', e => {
      const form = e.target.closest('form')
      if (!form) return
      e.preventDefault()
      const adults = parseInt(form.querySelector('[name="adults"]').value, 10) || 0
      const children = parseInt(form.querySelector('[name="children"]').value, 10) || 0
      const families = parseInt(form.querySelector('[name="families"]').value, 10) || 0
      const batchId = form.dataset.batchId
      const scId = form.closest('[data-sc-id]')?.dataset?.scId ?? null

      if (!scId) return

      if (batchId) {
        this.#updateScUseCase.execute({ editionId: this.#editionId, subCounterId: scId, batchId, adults, children, families })
          .then(() => this.#updated())
          .catch(err => this.#error(err))
      } else {
        this.#recordScUseCase.execute({ editionId: this.#editionId, subCounterId: scId, adults, children, families })
          .then(() => { form.reset(); this.#updated() })
          .catch(err => this.#error(err))
      }
    })
  }

  refresh(log) {
    const totalAdults = log?.totalAdults ?? 0
    const totalChildren = log?.totalChildren ?? 0
    const totalFamilies = log?.totalFamilies ?? 0
    const total = log?.total ?? 0
    const subCounters = log?.subCounters ?? []

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

  #renderSubCounter(sc) {
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

  #renderBatchList(batches, scId) {
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

  #fmtTime(ts) {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  #updated() {
    this.dispatchEvent(new CustomEvent('entries-updated', { bubbles: true }))
  }

  #error(err) {
    this.dispatchEvent(new CustomEvent('fest-error', { detail: { message: err.message }, bubbles: true }))
  }
}

customElements.define('fest-entry-counter', FestEntryCounter)
