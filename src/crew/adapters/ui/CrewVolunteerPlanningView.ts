export class CrewVolunteerPlanningView extends HTMLElement {
  async refresh({ scheduleRepo, volunteerRepo, postRepo }, editionId) {
    const [schedule, volunteers, posts] = await Promise.all([
      scheduleRepo.findByEdition(editionId),
      volunteerRepo.findAll(),
      postRepo.findAll(),
    ])

    if (!schedule) {
      this.innerHTML = '<p class="text-muted">Aucune affectation enregistrée.</p>'
      return
    }

    const slotMap = {}
    for (const post of posts) {
      for (const slot of post.slots) {
        slotMap[slot.id] = { postName: post.name.value, window: slot.window }
      }
    }

    this.innerHTML = volunteers.map(volunteer => {
      const assignments = schedule.getAssignmentsForVolunteer(volunteer.id)
      const slots = assignments
        .map(a => slotMap[a.slotId])
        .filter(Boolean)
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
                ${slots.map(s => `
                  <li class="list-group-item py-1 px-0 small">
                    <span class="badge bg-light text-dark border me-2">${s.window.day}</span>
                    ${s.window.startTime}–${s.window.endTime}
                    <span class="text-muted ms-1">· ${s.postName}</span>
                  </li>
                `).join('')}
              </ul>`
          }
        </div>
      `
    }).join('<hr class="my-2">')
  }
}

customElements.define('crew-volunteer-planning-view', CrewVolunteerPlanningView)
