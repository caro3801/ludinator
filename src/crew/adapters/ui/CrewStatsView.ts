import { ScheduleRepository } from '../../ports/ScheduleRepository'
import { VolunteerRepository } from '../../ports/VolunteerRepository'
import { Schedule } from '../../domain/model/Schedule'
import { Volunteer } from '../../domain/model/Volunteer'
import { EditionId, VolunteerId } from '../../../shared/types'

interface VolunteerStatsRow {
  name: string
  id: VolunteerId
  hours: number
}

export class CrewStatsView extends HTMLElement {
  async refresh(
    { scheduleRepo, volunteerRepo }:
      { scheduleRepo: ScheduleRepository, volunteerRepo: VolunteerRepository },
    editionId: EditionId
  ): Promise<void> {
    const [schedule, volunteers] = await Promise.all([
      scheduleRepo.findByEdition(editionId),
      volunteerRepo.findAll(),
    ])

    if (!schedule || !volunteers.length) {
      this.innerHTML = '<p class="text-muted">Aucune donnée disponible.</p>'
      return
    }

    const rows: VolunteerStatsRow[] = (volunteers as Volunteer[])
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
