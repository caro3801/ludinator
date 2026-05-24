import { ScheduleRepository } from '../../ports/ScheduleRepository'
import { VolunteerRepository } from '../../ports/VolunteerRepository'
import { PostRepository } from '../../ports/PostRepository'
import { Schedule } from '../../domain/model/Schedule'
import { Volunteer } from '../../domain/model/Volunteer'
import { Post } from '../../domain/model/Post'
import { EditionId, VolunteerId, PostId } from '../../../shared/types'

interface VolunteerStatsRow {
  name: string
  id: VolunteerId
  hours: number
}

interface PostStatsRow {
  id: PostId
  name: string
  required: number
  assigned: number
  isComplete: boolean
}

export class CrewStatsView extends HTMLElement {
  async refresh(
    { scheduleRepo, volunteerRepo, postRepo }:
      { scheduleRepo: ScheduleRepository, volunteerRepo: VolunteerRepository, postRepo: PostRepository },
    editionId: EditionId
  ): Promise<void> {
    const [schedule, volunteers, posts] = await Promise.all([
      scheduleRepo.findByEdition(editionId),
      volunteerRepo.findAll(),
      postRepo.findAll(),
    ])

    if (!schedule) {
      this.innerHTML = '<p class="text-muted">Aucune donnée disponible.</p>'
      return
    }

    // Volunteer stats
    const volunteerRows: VolunteerStatsRow[] = (volunteers as Volunteer[])
      .map(v => {
        const assignments = schedule.getAssignmentsForVolunteer(v.id)
        const hours = assignments.reduce((sum, a) => sum + a.window.durationHours, 0)
        return { name: v.name.value, id: v.id, hours }
      })
      .sort((a, b) => b.hours - a.hours)

    const assignedVolunteers = volunteerRows.filter(r => r.hours > 0).length
    const totalVolunteers = volunteers.length

    // Post coverage stats
    const postRows: PostStatsRow[] = (posts as Post[]).map(post => {
      const totalSlots = post.slots.length * post.minVolunteers
      const assignedSlots = post.slots.reduce((sum, slot) => {
        const assignments = schedule.getAssignmentsForSlot(slot.id)
        return sum + assignments.length
      }, 0)
      const isComplete = assignedSlots >= totalSlots
      return {
        id: post.id,
        name: post.name.value,
        required: totalSlots,
        assigned: assignedSlots,
        isComplete,
      }
    })

    this.innerHTML = `
      <p class="text-muted">${assignedVolunteers} / ${totalVolunteers}</p>
      <table class="table table-sm table-striped">
        <thead>
          <tr>
            <th>Bénévole</th>
            <th class="text-end">Heures</th>
          </tr>
        </thead>
        <tbody>
          ${volunteerRows.map(r => `
            <tr data-volunteer-id="${r.id}">
              <td>${r.name}</td>
              <td class="text-end">${(r.hours % 1 === 0 ? r.hours : r.hours.toFixed(1)) + 'h'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <table class="table table-sm table-striped mt-3">
        <thead>
          <tr>
            <th>Poste</th>
            <th class="text-end">Couverture</th>
            <th class="text-end">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${postRows.map(r => `
            <tr data-post-id="${r.id}">
              <td>${r.name}</td>
              <td class="text-end">${r.assigned} / ${r.required}</td>
              <td class="text-end">${r.isComplete ? 'Complet' : 'Incomplet'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }
}

customElements.define('crew-stats-view', CrewStatsView)
