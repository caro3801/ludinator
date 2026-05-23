import { ScheduleRepository } from '../../ports/ScheduleRepository'
import { VolunteerRepository } from '../../ports/VolunteerRepository'
import { PostRepository } from '../../ports/PostRepository'
import { Schedule } from '../../domain/model/Schedule'
import { Volunteer } from '../../domain/model/Volunteer'
import { Post } from '../../domain/model/Post'
import { EditionId } from '../../../shared/types'

interface SlotAssignment {
  time: string
  names: string[]
}

export class CrewScheduleView extends HTMLElement {
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
      this.innerHTML = '<p class="text-muted">Aucune affectation enregistrée.</p>'
      return
    }

    const volunteerMap: Record<string, string> = Object.fromEntries(
      (volunteers as Volunteer[]).map(v => [v.id, v.name.value])
    )

    // Build: day → post → [{ slot, volunteers[] }]
    type DaysType = Record<string, Record<string, SlotAssignment[]>>
    const days: DaysType = {}
    for (const post of posts as Post[]) {
      for (const slot of post.slots) {
        const assignments = schedule.getAssignmentsForSlot(slot.id)
        if (!assignments.length) continue
        const day = slot.window.day
        if (!days[day]) days[day] = {}
        if (!days[day][post.name.value]) days[day][post.name.value] = []
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
