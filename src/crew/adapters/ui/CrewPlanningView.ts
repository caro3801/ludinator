import { Schedule } from '../../domain/model/Schedule'
import { Volunteer } from '../../domain/model/Volunteer'
import { Post } from '../../domain/model/Post'
import { ScheduleRepository } from '../../ports/ScheduleRepository'
import { VolunteerRepository } from '../../ports/VolunteerRepository'
import { PostRepository } from '../../ports/PostRepository'
import { EditionId, SlotId, PostId, VolunteerId } from '../../../shared/types'
import { compareDays, compareSlotsByDay } from '../../domain/utils/dayOrder'

export class CrewPlanningView extends HTMLElement {
  #mode: 'post' | 'volunteer' = 'post'
  #day: string = 'all'
  #onlyUnderstaffed: boolean = false
  #selectedVolunteer: VolunteerId | null = null
  #schedule: Schedule | null = null
  #volunteers: Volunteer[] = []
  #posts: Post[] = []
  #slotMap: Record<string, { postName: string, postId: PostId, minVolunteers: number, window: { day: string, startTime: string, endTime: string } }> = {}
  #conflictIndex: Map<SlotId, Map<VolunteerId, SlotId>> = new Map()

  connectedCallback() {
    this.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const toggle = target.closest<HTMLElement>('button[data-mode], button[data-day]')
      if (toggle) {
        if (toggle.dataset.mode) {
          this.#mode = toggle.dataset.mode as 'post' | 'volunteer'
          this.#selectedVolunteer = null // Reset volunteer filter when switching modes
        }
        if (toggle.dataset.day) this.#day = toggle.dataset.day
        this.#render()
        return
      }
      const filterBtn = target.closest<HTMLElement>('button[data-filter="understaffed"]')
      if (filterBtn) {
        this.#onlyUnderstaffed = !this.#onlyUnderstaffed
        if (!this.#onlyUnderstaffed) this.#showAvailableVolunteers = false
        this.#render()
        return
      }
      const availableBtn = target.closest<HTMLElement>('button[data-filter="available-volunteers"]')
      if (availableBtn) {
        this.#showAvailableVolunteers = !this.#showAvailableVolunteers
        this.#render()
        return
      }
      const del = target.closest<HTMLElement>('button[data-action="unassign"]')
      if (del) {
        this.dispatchEvent(new CustomEvent('assignment-delete-requested', {
          detail: { assignmentId: del.dataset.assignmentId },
          bubbles: true,
        }))
        return
      }
      const add = target.closest<HTMLElement>('button[data-action="add-assignment"]')
      if (add) {
        this.dispatchEvent(new CustomEvent('assign-slot-requested', {
          detail: { slotId: add.dataset.slotId, postId: add.dataset.postId },
          bubbles: true,
        }))
      }
    })

    this.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement | null
      if (!target || !target.matches('select[data-filter="volunteer"]')) return
      this.#selectedVolunteer = target.value ? target.value as VolunteerId : null
      this.#updateContent()
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
    this.#buildSlotMap()
    this.#buildConflictIndex()
    this.#render()
  }

  #buildSlotMap(): void {
    this.#slotMap = {}
    for (const post of this.#posts) {
      for (const slot of post.slots) {
        this.#slotMap[slot.id] = { postName: post.name.value, postId: post.id, minVolunteers: post.minVolunteers, window: { day: slot.window.day, startTime: slot.window.startTime, endTime: slot.window.endTime } }
      }
    }
  }

  #buildConflictIndex(): void {
    this.#conflictIndex = new Map()
    if (!this.#schedule) return
    for (const { volunteerId, slotIdA, slotIdB } of this.#schedule.getConflicts()) {
      if (!this.#conflictIndex.has(slotIdA)) this.#conflictIndex.set(slotIdA, new Map())
      if (!this.#conflictIndex.has(slotIdB)) this.#conflictIndex.set(slotIdB, new Map())
      const mapA = this.#conflictIndex.get(slotIdA)!
      const mapB = this.#conflictIndex.get(slotIdB)!
      mapA.set(volunteerId, slotIdB)
      mapB.set(volunteerId, slotIdA)
    }
  }

  #conflictTooltip(volunteerId: VolunteerId, slotId: SlotId): string | null {
    const conflictSlotId = this.#conflictIndex.get(slotId)?.get(volunteerId)
    if (!conflictSlotId) return null
    const other = this.#slotMap[conflictSlotId]
    return other ? `Conflit : ${other.postName} ${other.window.startTime}–${other.window.endTime}` : 'Conflit'
  }

  #volunteerTag(name: string, volunteerId: VolunteerId, slotId: SlotId): string {
    const tooltip = this.#conflictTooltip(volunteerId, slotId)
    return tooltip
      ? `<span class="text-danger" data-conflict title="${tooltip}">⚠ ${name}</span>`
      : `<span>${name}</span>`
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

  #days(): string[] {
    const days = new Set<string>()
    for (const post of this.#posts) {
      for (const slot of post.slots) days.add(slot.window.day)
    }
    return [...days].sort(compareDays)
  }

  #render(): void {
    const days = this.#days()
    this.innerHTML = `
      <div class="d-flex flex-wrap gap-3 mb-3">
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-outline-primary ${this.#mode === 'post' ? 'active' : ''}" data-mode="post">Par poste</button>
          <button class="btn btn-outline-primary ${this.#mode === 'volunteer' ? 'active' : ''}" data-mode="volunteer">Par bénévole</button>
        </div>
        ${days.length > 0 ? `
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-secondary ${this.#day === 'all' ? 'active' : ''}" data-day="all">Tous</button>
            ${days.map((d: string) => `
              <button class="btn btn-outline-secondary ${this.#day === d ? 'active' : ''}" data-day="${d}">${d}</button>
            `).join('')}
          </div>` : ''}
        <button class="btn btn-sm btn-outline-warning ${this.#onlyUnderstaffed ? 'active' : ''}" data-filter="understaffed">⚠ Incomplets seulement</button>
        ${this.#onlyUnderstaffed ? '<button class="btn btn-sm btn-outline-info" data-filter="available-volunteers">Bénévoles disponibles</button>' : ''}
        ${this.#renderVolunteerSelect()}
      </div>
      <div class="planning-content">${this.#renderContent()}</div>
    `
  }

  #showAvailableVolunteers: boolean = false

  #getAvailableVolunteersForSlot(slotId: SlotId): Volunteer[] {
    if (!this.#schedule) return []
    
    const slot = this.#findSlotById(slotId)
    if (!slot) return []
    
    // Get volunteers assigned to this exact time slot (same day, startTime, endTime) across ALL posts
    const assignedAtSameTime = new Set<VolunteerId>()
    for (const post of this.#posts) {
      for (const s of post.slots) {
        if (s.window.day === slot.window.day && 
            s.window.startTime === slot.window.startTime && 
            s.window.endTime === slot.window.endTime) {
          const assignments = this.#schedule.getAssignmentsForSlot(s.id)
          for (const a of assignments) {
            assignedAtSameTime.add(a.volunteerId)
          }
        }
      }
    }
    
    // Return volunteers who are NOT assigned to any slot at the same time
    return this.#volunteers.filter(v => !assignedAtSameTime.has(v.id))
  }

  #findSlotById(slotId: SlotId): { window: { day: string, startTime: string, endTime: string } } | null {
    for (const post of this.#posts) {
      for (const slot of post.slots) {
        if (slot.id === slotId) return { window: slot.window }
      }
    }
    return null
  }

  #updateContent(): void {
    this.querySelectorAll<HTMLElement>('button[data-mode]').forEach(btn => {
      if (btn.dataset.mode) btn.classList.toggle('active', btn.dataset.mode === this.#mode)
    })
    this.querySelectorAll<HTMLElement>('button[data-day]').forEach(btn => {
      if (btn.dataset.day) btn.classList.toggle('active', btn.dataset.day === this.#day)
    })
    const understaffedBtn = this.querySelector<HTMLElement>('button[data-filter="understaffed"]')
    if (understaffedBtn) understaffedBtn.classList.toggle('active', this.#onlyUnderstaffed)
    const volunteerSelect = this.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
    if (volunteerSelect) {
      volunteerSelect.value = this.#selectedVolunteer ?? ''
    }
    const content = this.querySelector<HTMLElement>('.planning-content')
    if (content) content.innerHTML = this.#renderContent()
  }

  #renderContent(): string {
    if (!this.#schedule) return '<p class="text-muted">Aucune affectation enregistrée.</p>'
    return this.#mode === 'post' ? this.#renderByPost() : this.#renderByVolunteer()
  }

  #renderByPost(): string {
    const volunteerMap: Record<string, string> = Object.fromEntries(this.#volunteers.map(v => [v.id, v.name.value]))
    type SlotData = { time: string, staffed: boolean, addBtn: string, tags: string[], availableVolunteers: string[] }
    type DaySlots = Record<string, SlotData[]>
    type DaysMap = Record<string, DaySlots>
    const days: DaysMap = {}

    for (const post of this.#posts) {
      // When filtering by volunteer, only show posts that have at least one slot with that volunteer
      if (this.#selectedVolunteer) {
        const postHasVolunteer = post.slots.some(slot => {
          const slotAssignments = this.#schedule!.getAssignmentsForSlot(slot.id)
          return slotAssignments.some(a => a.volunteerId === this.#selectedVolunteer)
        })
        if (!postHasVolunteer) continue
      }

      for (const slot of post.slots) {
        if (this.#day !== 'all' && slot.window.day !== this.#day) continue
        let assignments = this.#schedule!.getAssignmentsForSlot(slot.id)
        // Filter by selected volunteer if one is selected
        if (this.#selectedVolunteer) {
          assignments = assignments.filter(a => a.volunteerId === this.#selectedVolunteer)
        }
        // When filtering by volunteer, only show slots where that volunteer is assigned
        if (this.#selectedVolunteer && assignments.length === 0) continue
        const staffed = assignments.length >= post.minVolunteers
        if (this.#onlyUnderstaffed && staffed) continue
        const day = slot.window.day
        if (!days[day]) days[day] = {}
        if (!days[day][post.name.value]) days[day][post.name.value] = []
        const addBtn = `<button class="btn btn-link btn-sm p-0 ms-2 text-success" data-action="add-assignment" data-slot-id="${slot.id}" data-post-id="${post.id}" title="Affecter un bénévole">+</button>`
        const tags = assignments.map(a => {
          const name = volunteerMap[a.volunteerId] ?? a.volunteerId
          const tag = this.#volunteerTag(name, a.volunteerId, slot.id)
          const btn = `<button class="btn btn-link btn-sm p-0 ms-1 text-danger" data-action="unassign" data-assignment-id="${a.id}" title="Retirer">✕</button>`
          return tag + btn
        })
        
        // Get available volunteers for this slot (not assigned to same time on any post)
        const availableVolunteers = this.#showAvailableVolunteers && !staffed 
          ? this.#getAvailableVolunteersForSlot(slot.id)
              .sort((a, b) => a.name.value.localeCompare(b.name.value))
              .map(v => v.name.value)
          : []
        
        days[day][post.name.value].push({
          time: `${slot.window.startTime}–${slot.window.endTime}`,
          staffed,
          addBtn,
          tags,
          availableVolunteers,
        })
      }
    }

    if (!Object.keys(days).length) return '<p class="text-muted">Aucune affectation pour ce filtre.</p>'

    return Object.entries(days).sort(([a], [b]) => compareDays(a, b)).map(([day, postMap]) => `
      <h6 class="text-uppercase text-secondary mt-3">${day}</h6>
      ${Object.entries(postMap).map(([postName, slots]) => `
        <div class="mb-2">
          <strong>${postName}</strong>
          <ul class="mb-0">
            ${slots.map(s => {
              const availableHtml = s.availableVolunteers.length > 0 
                ? ` — <span class="text-info">Disponibles: ${s.availableVolunteers.join(', ')}</span>` 
                : ''
              return `<li class="small">${s.time}${s.staffed ? '' : ' <span class="text-warning">⚠</span>'} — ${s.tags.length ? s.tags.join(', ') : '<span class="text-muted">Aucun bénévole</span>'}${s.addBtn}${availableHtml}</li>`
            }).join('')}
          </ul>
        </div>
      `).join('')}
    `).join('')
  }

  #renderByVolunteer(): string {
    const sortedVolunteers = [...this.#volunteers].sort((a, b) => a.name.value.localeCompare(b.name.value))
    const volunteersToShow = this.#selectedVolunteer
      ? sortedVolunteers.filter(v => v.id === this.#selectedVolunteer)
      : sortedVolunteers
    
    return volunteersToShow.map(volunteer => {
      const assignments = this.#schedule!.getAssignmentsForVolunteer(volunteer.id)
      const slots = assignments
        .map(a => ({ assignmentId: a.id, slotId: a.slotId, ...this.#slotMap[a.slotId] }))
        .filter((s): s is typeof s & { window: { day: string, startTime: string, endTime: string } } => 
          s.window !== undefined && (this.#day === 'all' || s.window.day === this.#day))
        .sort(compareSlotsByDay)

      return `
        <div class="mb-3">
          <h6 class="fw-bold mb-1">${volunteer.name.value}</h6>
          ${slots.length === 0
            ? '<p class="text-muted small mb-0">Aucun créneau assigné.</p>'
            : `<ul class="list-group list-group-flush">
                ${slots.map(s => {
                  const tooltip = this.#conflictTooltip(volunteer.id, s.slotId)
                  const flag = tooltip ? `<span class="text-danger ms-2" data-conflict title="${tooltip}">⚠</span>` : ''
                  const unassignBtn = `<button class="btn btn-link btn-sm p-0 ms-auto text-danger" data-action="unassign" data-assignment-id="${s.assignmentId}" title="Retirer">✕</button>`
                  return `<li class="list-group-item py-1 px-0 small d-flex align-items-center gap-1">
                    <span class="badge bg-light text-dark border me-2">${s.window.day}</span>
                    ${s.window.startTime}–${s.window.endTime}
                    <span class="text-muted ms-1">· ${s.postName}</span>${flag}${unassignBtn}
                  </li>`
                }).join('')}
              </ul>`
          }
        </div>
      `
    }).join('<hr class="my-2">')
  }
}

customElements.define('crew-planning-view', CrewPlanningView)
