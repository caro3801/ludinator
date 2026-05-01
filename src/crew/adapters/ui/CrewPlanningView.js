export class CrewPlanningView extends HTMLElement {
  #mode = 'post'
  #day = 'all'
  #onlyUnderstaffed = false
  #schedule = null
  #volunteers = []
  #posts = []
  #slotMap = {}
  #conflictIndex = new Map() // slotId → Map(volunteerId → conflicting slotId)

  connectedCallback() {
    this.addEventListener('click', e => {
      const toggle = e.target.closest('button[data-mode], button[data-day]')
      if (toggle) {
        if (toggle.dataset.mode) this.#mode = toggle.dataset.mode
        if (toggle.dataset.day) this.#day = toggle.dataset.day
        this.#updateContent()
        return
      }
      const filterBtn = e.target.closest('button[data-filter="understaffed"]')
      if (filterBtn) {
        this.#onlyUnderstaffed = !this.#onlyUnderstaffed
        this.#updateContent()
        return
      }
      const del = e.target.closest('button[data-action="unassign"]')
      if (del) {
        this.dispatchEvent(new CustomEvent('assignment-delete-requested', {
          detail: { assignmentId: del.dataset.assignmentId },
          bubbles: true,
        }))
        return
      }
      const add = e.target.closest('button[data-action="add-assignment"]')
      if (add) {
        this.dispatchEvent(new CustomEvent('assign-slot-requested', {
          detail: { slotId: add.dataset.slotId, postId: add.dataset.postId },
          bubbles: true,
        }))
      }
    })
  }

  async refresh({ scheduleRepo, volunteerRepo, postRepo }, editionId) {
    const [schedule, volunteers, posts] = await Promise.all([
      scheduleRepo.findByEdition(editionId),
      volunteerRepo.findAll(),
      postRepo.findAll(),
    ])
    this.#schedule = schedule
    this.#volunteers = volunteers
    this.#posts = posts
    this.#buildSlotMap()
    this.#buildConflictIndex()
    this.#render()
  }

  #buildSlotMap() {
    this.#slotMap = {}
    for (const post of this.#posts) {
      for (const slot of post.slots) {
        this.#slotMap[slot.id] = { postName: post.name.value, postId: post.id, minVolunteers: post.minVolunteers, window: slot.window }
      }
    }
  }

  #buildConflictIndex() {
    this.#conflictIndex = new Map()
    if (!this.#schedule) return
    for (const { volunteerId, slotIdA, slotIdB } of this.#schedule.getConflicts()) {
      if (!this.#conflictIndex.has(slotIdA)) this.#conflictIndex.set(slotIdA, new Map())
      if (!this.#conflictIndex.has(slotIdB)) this.#conflictIndex.set(slotIdB, new Map())
      this.#conflictIndex.get(slotIdA).set(volunteerId, slotIdB)
      this.#conflictIndex.get(slotIdB).set(volunteerId, slotIdA)
    }
  }

  #conflictTooltip(volunteerId, slotId) {
    const conflictSlotId = this.#conflictIndex.get(slotId)?.get(volunteerId)
    if (!conflictSlotId) return null
    const other = this.#slotMap[conflictSlotId]
    return other ? `Conflit : ${other.postName} ${other.window.startTime}–${other.window.endTime}` : 'Conflit'
  }

  #volunteerTag(name, volunteerId, slotId) {
    const tooltip = this.#conflictTooltip(volunteerId, slotId)
    return tooltip
      ? `<span class="text-danger" data-conflict title="${tooltip}">⚠ ${name}</span>`
      : `<span>${name}</span>`
  }

  #days() {
    const days = new Set()
    for (const post of this.#posts) {
      for (const slot of post.slots) days.add(slot.window.day)
    }
    return [...days].sort()
  }

  #render() {
    const days = this.#days()
    this.innerHTML = `
      <div class="d-flex flex-wrap gap-3 mb-3">
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-outline-primary ${this.#mode === 'post' ? 'active' : ''}" data-mode="post">Par poste</button>
          <button class="btn btn-outline-primary ${this.#mode === 'volunteer' ? 'active' : ''}" data-mode="volunteer">Par bénévole</button>
        </div>
        ${days.length > 0 ? `
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-secondary ${this.#day === 'all' ? 'active' : ''}" data-day="all">Tous</button>
            ${days.map(d => `
              <button class="btn btn-outline-secondary ${this.#day === d ? 'active' : ''}" data-day="${d}">${d}</button>
            `).join('')}
          </div>` : ''}
        <button class="btn btn-sm btn-outline-warning ${this.#onlyUnderstaffed ? 'active' : ''}" data-filter="understaffed">⚠ Incomplets seulement</button>
      </div>
      <div class="planning-content">${this.#renderContent()}</div>
    `
  }

  #updateContent() {
    this.querySelectorAll('button[data-mode]').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.mode === this.#mode)
    )
    this.querySelectorAll('button[data-day]').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.day === this.#day)
    )
    const understaffedBtn = this.querySelector('button[data-filter="understaffed"]')
    if (understaffedBtn) understaffedBtn.classList.toggle('active', this.#onlyUnderstaffed)
    this.querySelector('.planning-content').innerHTML = this.#renderContent()
  }

  #renderContent() {
    if (!this.#schedule) return '<p class="text-muted">Aucune affectation enregistrée.</p>'
    return this.#mode === 'post' ? this.#renderByPost() : this.#renderByVolunteer()
  }

  #renderByPost() {
    const volunteerMap = Object.fromEntries(this.#volunteers.map(v => [v.id, v.name.value]))
    const days = {}

    for (const post of this.#posts) {
      for (const slot of post.slots) {
        if (this.#day !== 'all' && slot.window.day !== this.#day) continue
        const assignments = this.#schedule.getAssignmentsForSlot(slot.id)
        const staffed = assignments.length >= post.minVolunteers
        if (this.#onlyUnderstaffed && staffed) continue
        const day = slot.window.day
        days[day] ??= {}
        days[day][post.name.value] ??= []
        const addBtn = `<button class="btn btn-link btn-sm p-0 ms-2 text-success" data-action="add-assignment" data-slot-id="${slot.id}" data-post-id="${post.id}" title="Affecter un bénévole">+</button>`
        const tags = assignments.map(a => {
          const name = volunteerMap[a.volunteerId] ?? a.volunteerId
          const tag = this.#volunteerTag(name, a.volunteerId, slot.id)
          const btn = `<button class="btn btn-link btn-sm p-0 ms-1 text-danger" data-action="unassign" data-assignment-id="${a.id}" title="Retirer">✕</button>`
          return tag + btn
        })
        days[day][post.name.value].push({
          time: `${slot.window.startTime}–${slot.window.endTime}`,
          staffed,
          addBtn,
          tags,
        })
      }
    }

    if (!Object.keys(days).length) return '<p class="text-muted">Aucune affectation pour ce filtre.</p>'

    return Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).map(([day, postMap]) => `
      <h6 class="text-uppercase text-secondary mt-3">${day}</h6>
      ${Object.entries(postMap).map(([postName, slots]) => `
        <div class="mb-2">
          <strong>${postName}</strong>
          <ul class="mb-0">
            ${slots.map(s => `<li class="small">${s.time}${s.staffed ? '' : ' <span class="text-warning">⚠</span>'} — ${s.tags.length ? s.tags.join(', ') : '<span class="text-muted">Aucun bénévole</span>'}${s.addBtn}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    `).join('')
  }

  #renderByVolunteer() {
    return this.#volunteers.map(volunteer => {
      const assignments = this.#schedule.getAssignmentsForVolunteer(volunteer.id)
      const slots = assignments
        .map(a => ({ assignmentId: a.id, slotId: a.slotId, ...this.#slotMap[a.slotId] }))
        .filter(s => s.window && (this.#day === 'all' || s.window.day === this.#day))
        .sort((a, b) =>
          a.window.day.localeCompare(b.window.day) ||
          a.window.startTime.localeCompare(b.window.startTime)
        )

      return `
        <div class="mb-3">
          <h6 class="fw-bold mb-1">${volunteer.name.value}</h6>
          ${slots.length === 0
            ? '<p class="text-muted small mb-0">Aucun créneau assigné.</p>'
            : `<ul class="list-group list-group-flush">
                ${slots.map(s => {
                  const tooltip = this.#conflictTooltip(volunteer.id, s.slotId)
                  const flag = tooltip ? `<span class="text-danger ms-2" data-conflict title="${tooltip}">⚠</span>` : ''
                  const unassignBtn = `<button class="btn btn-link btn-sm p-0 ms-auto text-danger" data-action="unassign" data-assignment-id="${s.assignmentId}" title="Retirer">✕</button>`
                  return `<li class="list-group-item py-1 px-0 small d-flex align-items-center gap-1">
                    <span class="badge bg-light text-dark border me-2">${s.window.day}</span>
                    ${s.window.startTime}–${s.window.endTime}
                    <span class="text-muted ms-1">· ${s.postName}</span>${flag}${unassignBtn}
                  </li>`
                }).join('')}
              </ul>`
          }
        </div>
      `
    }).join('<hr class="my-2">')
  }
}

customElements.define('crew-planning-view', CrewPlanningView)
