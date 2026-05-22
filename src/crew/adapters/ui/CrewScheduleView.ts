export class CrewScheduleView extends HTMLElement {
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

    const volunteerMap = Object.fromEntries(volunteers.map(v => [v.id, v.name.value]))

    // Build: day → post → [{ slot, volunteers[] }]
    const days = {}
    for (const post of posts) {
      for (const slot of post.slots) {
        const assignments = schedule.getAssignmentsForSlot(slot.id)
        if (!assignments.length) continue
        const day = slot.window.day
        days[day] ??= {}
        days[day][post.name.value] ??= []
        days[day][post.name.value].push({
          time: `${slot.window.startTime}–${slot.window.endTime}`,
          names: assignments.map(a => volunteerMap[a.volunteerId] ?? a.volunteerId),
        })
      }
    }

    if (!Object.keys(days).length) {
      this.innerHTML = '<p class="text-muted">Aucune affectation enregistrée.</p>'
      return
    }

    this.innerHTML = Object.entries(days).map(([day, postMap]) => `
      <h6 class="text-uppercase text-secondary mt-3">${day}</h6>
      ${Object.entries(postMap).map(([postName, slots]) => `
        <div class="mb-2">
          <strong>${postName}</strong>
          <ul class="mb-0">
            ${slots.map(s => `
              <li class="small">${s.time} — ${s.names.join(', ')}</li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    `).join('')
  }
}

customElements.define('crew-schedule-view', CrewScheduleView)
