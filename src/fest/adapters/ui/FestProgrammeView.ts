export class FestProgrammeView extends HTMLElement {
  #hidePast = false
  #slots = []   // { day, startTime, endTime, activityName, location, registrationCount, maxParticipants, isOverCapacity }
  #nowFn = () => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  connectedCallback() {
    this.addEventListener('click', e => {
      if (e.target.closest('button[data-action="toggle-past"]')) {
        this.#hidePast = !this.#hidePast
        this.#updateContent()
      }
    })
  }

  async refresh(repo, { nowFn } = {}) {
    if (nowFn) this.#nowFn = nowFn
    const activities = await repo.findAll()

    this.#slots = []
    for (const activity of activities) {
      for (const slot of activity.slots) {
        this.#slots.push({
          day: slot.window.day,
          startTime: slot.window.startTime,
          endTime: slot.window.endTime,
          activityName: activity.name.value,
          location: activity.location,
          registrationCount: slot.registrationCount,
          maxParticipants: slot.maxParticipants,
          isOverCapacity: slot.isOverCapacity,
        })
      }
    }

    this.#render()
  }

  #visibleSlots() {
    if (!this.#hidePast) return this.#slots
    const now = this.#nowFn()
    return this.#slots.filter(s => s.endTime > now)
  }

  #render() {
    this.innerHTML = `
      <div class="mb-3">
        <button class="btn btn-sm btn-outline-secondary ${this.#hidePast ? 'active' : ''}"
          data-action="toggle-past">Masquer les activités passées</button>
      </div>
      <div class="programme-content">${this.#renderContent()}</div>
    `
  }

  #updateContent() {
    this.querySelector('button[data-action="toggle-past"]')
      .classList.toggle('active', this.#hidePast)
    this.querySelector('.programme-content').innerHTML = this.#renderContent()
  }

  #renderContent() {
    const slots = this.#visibleSlots()
    if (!slots.length) return '<p class="text-muted">Aucune activité à afficher.</p>'

    const byDay = {}
    for (const s of slots) {
      byDay[s.day] ??= []
      byDay[s.day].push(s)
    }
    for (const day of Object.keys(byDay)) {
      byDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
    }

    return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, daySlots]) => `
      <div class="mb-4" data-day="${day}">
        <h6 class="text-uppercase text-secondary border-bottom pb-1">${day}</h6>
        <div class="list-group list-group-flush">
          ${daySlots.map(s => `
            <div class="list-group-item px-0" data-slot>
              <div class="d-flex align-items-start gap-3">
                <span class="text-nowrap fw-bold small">${s.startTime}–${s.endTime}</span>
                <div class="flex-fill">
                  <span class="fw-semibold">${s.activityName}</span>
                  ${s.location ? `<span class="text-muted small ms-2">· ${s.location}</span>` : ''}
                </div>
                <span class="small ${s.isOverCapacity ? 'text-danger fw-bold' : 'text-muted'}"
                  ${s.isOverCapacity ? 'data-overcapacity' : ''}>
                  ${s.registrationCount}${s.maxParticipants ? ` / ${s.maxParticipants}` : ''} inscrit${s.registrationCount !== 1 ? 's' : ''}${s.isOverCapacity ? ' ⚠' : ''}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')
  }
}

customElements.define('fest-programme-view', FestProgrammeView)
