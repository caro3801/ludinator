import { ScheduleRepository } from '../../ports/ScheduleRepository'
import { VolunteerRepository } from '../../ports/VolunteerRepository'
import { PostRepository } from '../../ports/PostRepository'
import { Schedule } from '../../domain/model/Schedule'
import { Volunteer } from '../../domain/model/Volunteer'
import { Post } from '../../domain/model/Post'
import { EditionId, SlotId } from '../../../shared/types'
import { compareSlotsByDay } from '../../domain/utils/dayOrder'

interface SlotInfo {
  postName: string
  window: { day: string, startTime: string, endTime: string }
}

export class CrewVolunteerPlanningView extends HTMLElement {
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

    const slotMap: Record<SlotId, SlotInfo> = {}
    for (const post of posts as Post[]) {
      for (const slot of post.slots) {
        slotMap[slot.id] = { postName: post.name.value, window: { day: slot.window.day, startTime: slot.window.startTime, endTime: slot.window.endTime } }
      }
    }

    const sortedVolunteers = [...(volunteers as Volunteer[])].sort((a, b) => a.name.value.localeCompare(b.name.value))
    this.innerHTML = sortedVolunteers.map(volunteer => {
      const assignments = schedule.getAssignmentsForVolunteer(volunteer.id)
      const slots = assignments
        .map(a => slotMap[a.slotId])
        .filter((s): s is SlotInfo => s !== undefined)
        .sort(compareSlotsByDay)

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
