export class CrewVolunteerList extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]')
      if (!btn) return
      const { action, volunteerId, name } = btn.dataset
      if (action === 'edit-volunteer-name') {
        this.dispatchEvent(new CustomEvent('volunteer-edit-name-requested', {
          detail: { volunteerId, name },
          bubbles: true,
        }))
      }
      if (action === 'delete-volunteer') {
        this.dispatchEvent(new CustomEvent('volunteer-delete-requested', {
          detail: { volunteerId },
          bubbles: true,
        }))
      }
    })
  }

  async refresh(repo) {
    const volunteers = await repo.findAll()
    if (volunteers.length === 0) {
      this.innerHTML = '<p class="text-muted">Aucun bénévole enregistré.</p>'
      return
    }
    this.innerHTML = `<ul class="list-group">${volunteers.map(v => `
      <li class="list-group-item d-flex align-items-center gap-2">
        <span>${v.name.value}</span>
        <button class="btn btn-outline-secondary btn-sm py-0 px-1 ms-auto"
          data-action="edit-volunteer-name"
          data-volunteer-id="${v.id}"
          data-name="${v.name.value}">✏️</button>
        <button class="btn btn-outline-danger btn-sm py-0 px-1"
          data-action="delete-volunteer"
          data-volunteer-id="${v.id}">🗑</button>
      </li>
    `).join('')}</ul>`
  }
}

customElements.define('crew-volunteer-list', CrewVolunteerList)
