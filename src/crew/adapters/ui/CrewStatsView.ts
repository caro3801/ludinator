export class CrewStatsView extends HTMLElement {
  async refresh({ scheduleRepo, volunteerRepo }, editionId) {
    const [schedule, volunteers] = await Promise.all([
      scheduleRepo.findByEdition(editionId),
      volunteerRepo.findAll(),
    ])

    if (!schedule || !volunteers.length) {
      this.innerHTML = '<p class="text-muted">Aucune donnée disponible.</p>'
      return
    }

    const rows = volunteers
      .map(v => {
        const assignments = schedule.getAssignmentsForVolunteer(v.id)
        const hours = assignments.reduce((sum, a) => sum + a.window.durationHours, 0)
        return { name: v.name.value, id: v.id, hours }
      })
      .sort((a, b) => b.hours - a.hours)

    this.innerHTML = `
      <table class="table table-sm table-striped">
        <thead>
          <tr>
            <th>Bénévole</th>
            <th class="text-end">Heures</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr data-volunteer-id="${r.id}">
              <td>${r.name}</td>
              <td class="text-end">${r.hours % 1 === 0 ? r.hours : r.hours.toFixed(1)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }
}

customElements.define('crew-stats-view', CrewStatsView)
