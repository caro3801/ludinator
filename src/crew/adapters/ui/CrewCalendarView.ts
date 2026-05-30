import { Schedule } from '../../domain/model/Schedule'
import { Volunteer } from '../../domain/model/Volunteer'
import { Post } from '../../domain/model/Post'
import { EditionId, VolunteerId } from '../../../shared/types'
import { compareDays } from '../../domain/utils/dayOrder'
import type { ScheduleRepository } from '../../ports/ScheduleRepository'
import type { VolunteerRepository } from '../../ports/VolunteerRepository'
import type { PostRepository } from '../../ports/PostRepository'

export class CrewCalendarView extends HTMLElement {
  #selectedVolunteer: VolunteerId | null = null
  #schedule: Schedule | null = null
  #volunteers: Volunteer[] = []
  #posts: Post[] = []

  connectedCallback() {
    this.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement | null
      if (!target || !target.matches('select[data-filter="volunteer"]')) return
      this.#selectedVolunteer = target.value ? target.value as VolunteerId : null
      this.#render()
    })
  }

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
    this.#schedule = schedule
    this.#volunteers = volunteers
    this.#posts = posts
    this.#render()
  }

  #getAllSlots(): { id: string, window: { day: string, startTime: string, endTime: string }, postName: string, assignments: VolunteerId[] }[] {
    const slots: { id: string, window: { day: string, startTime: string, endTime: string }, postName: string, assignments: VolunteerId[] }[] = []
    
    if (!this.#schedule) return slots
    
    for (const post of this.#posts) {
      for (const slot of post.slots) {
        const assignments = this.#schedule.getAssignmentsForSlot(slot.id)
        slots.push({
          id: slot.id,
          window: slot.window,
          postName: post.name.value,
          assignments: assignments.map(a => a.volunteerId)
        })
      }
    }
    return slots
  }

  #getDays(): string[] {
    const days = new Set<string>()
    for (const post of this.#posts) {
      for (const slot of post.slots) {
        days.add(slot.window.day)
      }
    }
    return [...days].sort()
  }

  #getTimeSlots(): string[] {
    const times = new Set<string>()
    for (const post of this.#posts) {
      for (const slot of post.slots) {
        times.add(`${slot.window.startTime}–${slot.window.endTime}`)
      }
    }
    return [...times].sort()
  }

  #getVolunteerName(volunteerId: VolunteerId): string {
    const volunteer = this.#volunteers.find(v => v.id === volunteerId)
    return volunteer ? volunteer.name.value : volunteerId
  }

  #renderVolunteerSelect(): string {
    const sortedVolunteers = [...this.#volunteers].sort((a, b) => a.name.value.localeCompare(b.name.value))
    const options = sortedVolunteers.map(v => 
      `<option value="${v.id}" ${this.#selectedVolunteer === v.id ? 'selected' : ''}>${v.name.value}</option>`
    ).join('')
    return `
      <div class="d-inline-block">
        <select class="form-select form-select-sm" data-filter="volunteer" style="min-width: 180px;">
          <option value="">-- Tous les bénévoles --</option>
          ${options}
        </select>
      </div>
    `
  }

  #renderCalendar(): string {
    if (!this.#schedule) return '<p class="text-muted">Aucune affectation enregistrée.</p>'
    
    const slots = this.#getAllSlots()
    const days = this.#getDays().sort(compareDays)
    const timeSlots = this.#getTimeSlots().sort()
    
    // Create a map: day -> time -> { postName, assignments }
    const calendar: Record<string, Record<string, { postName: string, assignments: VolunteerId[] }[]>> = {}
    
    for (const slot of slots) {
      // Filter by selected volunteer if one is selected
      if (this.#selectedVolunteer && !slot.assignments.includes(this.#selectedVolunteer)) {
        continue
      }
      const day = slot.window.day
      const time = `${slot.window.startTime}–${slot.window.endTime}`
      if (!calendar[day]) calendar[day] = {}
      if (!calendar[day][time]) calendar[day][time] = []
      calendar[day][time].push({ postName: slot.postName, assignments: slot.assignments })
    }
    
    // Check if there are any assignments at all (considering filters)
    const hasAssignments = Object.values(calendar).some(daySlots => 
      Object.values(daySlots).some(timeSlots => 
        timeSlots.some(s => s.assignments.length > 0)
      )
    )
    
    if (!hasAssignments) {
      return '<p class="text-muted">Aucune affectation enregistrée.</p>'
    }
    
    if (Object.keys(calendar).length === 0) {
      return '<p class="text-muted">Aucune affectation pour ce filtre.</p>'
    }
    
    // Render calendar table
    const dayHeaders = days.map(day => `<th class="calendar-day-header">${day}</th>`).join('')
    
    const rows = timeSlots.map(time => {
      const cells = days.map(day => {
        const daySlots = calendar[day]?.[time] || []
        if (daySlots.length === 0) return '<td></td>'
        
        // Group volunteers by post
        const postVolunteers: Map<string, VolunteerId[]> = new Map()
        for (const slot of daySlots) {
          if (!postVolunteers.has(slot.postName)) {
            postVolunteers.set(slot.postName, [])
          }
          for (const vId of slot.assignments) {
            postVolunteers.get(slot.postName)!.push(vId)
          }
        }
        
        const postHtml = Array.from(postVolunteers.entries()).map(([postName, volunteerIds]) => {
          const sortedVolunteerIds = [...new Set(volunteerIds)].sort((a, b) => 
            this.#getVolunteerName(a).localeCompare(this.#getVolunteerName(b))
          )
          const volunteerNames = sortedVolunteerIds.map(vId => this.#getVolunteerName(vId))
          const volunteersText = volunteerNames.length > 0 
            ? volunteerNames.join(', ') 
            : '<span class="text-muted">Aucun</span>'
          return `
            <div class="mb-1">
              <span class="fw-bold">${postName}:</span>
              <span class="ms-1">${volunteersText}</span>
            </div>
          `
        }).join('')
        
        return `<td class="calendar-time-slot small">${postHtml}</td>`
      }).join('')
      
      return `<tr><td class="text-end pe-2 small text-secondary">${time}</td>${cells}</tr>`
    }).join('')
    
    return `
      <div class="table-responsive">
        <table class="table table-bordered table-sm calendar-content">
          <thead>
            <tr><th class="calendar-time-header"></th>${dayHeaders}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
  }

  #render(): void {
    this.innerHTML = `
      <div class="d-flex flex-wrap gap-3 mb-3">
        ${this.#renderVolunteerSelect()}
      </div>
      <div class="calendar-view">${this.#renderCalendar()}</div>
    `
  }
}

customElements.define('crew-calendar-view', CrewCalendarView)
