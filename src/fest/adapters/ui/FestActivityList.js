export class FestActivityList extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]')
      if (!btn) return
      const { action, activityId, slotId, name } = btn.dataset
      if (action === 'rename-activity') {
        this.dispatchEvent(new CustomEvent('activity-rename-requested', {
          detail: { activityId, name },
          bubbles: true,
        }))
      }
      if (action === 'delete-activity') {
        this.dispatchEvent(new CustomEvent('activity-delete-requested', {
          detail: { activityId },
          bubbles: true,
        }))
      }
      if (action === 'add-entry') {
        const registrations = JSON.parse(decodeURIComponent(btn.dataset.registrations ?? '[]'))
        this.dispatchEvent(new CustomEvent('add-entry-requested', {
          detail: { activityId, slotId, registrations },
          bubbles: true,
        }))
      }
    })
  }

  async refresh(repo) {
    const activities = await repo.findAll()
    if (!activities.length) {
      this.innerHTML = '<p class="text-muted">Aucune activité enregistrée.</p>'
      return
    }
    this.innerHTML = activities.map(a => `
      <div class="card mb-3" data-activity-item data-activity-id="${a.id}">
        <div class="card-header d-flex align-items-center gap-2">
          <strong>${a.name.value}</strong>
          ${a.location ? `<span class="text-muted small">· ${a.location}</span>` : ''}
          <div class="ms-auto d-flex gap-1">
            <button class="btn btn-outline-secondary btn-sm py-0 px-1"
              data-action="rename-activity"
              data-activity-id="${a.id}"
              data-name="${a.name.value}">✏️</button>
            <button class="btn btn-outline-danger btn-sm py-0 px-1"
              data-action="delete-activity"
              data-activity-id="${a.id}">🗑</button>
          </div>
        </div>
        ${a.slots.length ? `
          <ul class="list-group list-group-flush">
            ${a.slots.map(s => `
              <li class="list-group-item small d-flex align-items-center gap-2">
                <span class="badge bg-secondary">${s.window.day}</span>
                <span>${s.window.startTime}–${s.window.endTime}</span>
                ${s.maxParticipants ? `<span class="text-muted">max ${s.maxParticipants}</span>` : ''}
                <span class="ms-auto d-flex align-items-center gap-3">
                  <span class="${s.isOverCapacity ? 'text-danger fw-bold' : ''}">${s.registrationCount} inscrit${s.registrationCount > 1 ? 's' : ''}${s.maxParticipants ? ` / ${s.maxParticipants}` : ''}${s.isOverCapacity ? ' ⚠' : ''}</span>
                  <button class="btn btn-outline-primary btn-sm py-0 px-2"
                    data-action="add-entry"
                    data-activity-id="${a.id}"
                    data-slot-id="${s.id}"
                    data-registrations="${encodeURIComponent(JSON.stringify(s.registrations.map(r => ({ id: r.id, personName: r.personName, waitlisted: r.waitlisted }))))}">+ Entrées</button>
                </span>
              </li>
            `).join('')}
          </ul>
        ` : '<div class="card-body text-muted small">Aucun créneau.</div>'}
      </div>
    `).join('')
  }
}

customElements.define('fest-activity-list', FestActivityList)
