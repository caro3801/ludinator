// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { CrewCalendarView } from './CrewCalendarView'
import './CrewCalendarView'
import type { ScheduleRepository } from '../../ports/ScheduleRepository'
import type { VolunteerRepository } from '../../ports/VolunteerRepository'
import type { PostRepository } from '../../ports/PostRepository'
import { Schedule } from '../../domain/model/Schedule'
import { Volunteer } from '../../domain/model/Volunteer'
import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'

const makeRepos = ({
  schedule = null,
  volunteers = [],
  posts = []
}: {
  schedule?: Schedule | null
  volunteers?: Volunteer[]
  posts?: Post[]
} = {}): {
  scheduleRepo: ScheduleRepository
  volunteerRepo: VolunteerRepository
  postRepo: PostRepository
} => ({
  scheduleRepo: { findByEdition: async () => schedule, save: async () => {}, findById: async () => null, findAll: async () => [], delete: async () => {} } as unknown as ScheduleRepository,
  volunteerRepo: { findAll: async () => volunteers, save: async () => {}, findById: async () => null, delete: async () => {} } as unknown as VolunteerRepository,
  postRepo: { findAll: async () => posts, save: async () => {}, findById: async () => null, delete: async () => {} } as unknown as PostRepository,
})

describe('CrewCalendarView', () => {
  let el: CrewCalendarView
  let alice: Volunteer
  let bob: Volunteer
  let accueil: Post
  let bar: Post
  let satMorning: TimeWindow
  let satAfternoon: TimeWindow
  let sunMorning: TimeWindow
  let schedule: Schedule

  beforeEach(() => {
    alice = Volunteer.create('Alice')
    bob = Volunteer.create('Bob')
    accueil = Post.create('Accueil', 2)
    bar = Post.create('Bar', 1)
    
    satMorning = new TimeWindow('saturday', '09:00', '12:00')
    satAfternoon = new TimeWindow('saturday', '14:00', '17:00')
    sunMorning = new TimeWindow('sunday', '10:00', '13:00')
    
    accueil.addSlot(satMorning)
    accueil.addSlot(sunMorning)
    bar.addSlot(satAfternoon)
    
    schedule = Schedule.create('edition-2024')
    schedule.assign(alice, accueil.slots[0]) // Alice on Accueil saturday morning
    schedule.assign(bob, bar.slots[0]) // Bob on Bar saturday afternoon

    el = document.createElement('crew-calendar-view') as CrewCalendarView
    document.body.appendChild(el)
  })

  it('renders calendar with days as columns', async () => {
    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil, bar] }), 'edition-2024')
    
    const dayHeaders = el.querySelectorAll('.calendar-day-header')
    const days = Array.from(dayHeaders).map(h => h.textContent?.trim())
    expect(days).toContain('saturday')
    expect(days).toContain('sunday')
  })

  it('renders time slots as rows', async () => {
    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil, bar] }), 'edition-2024')
    
    const timeSlots = el.querySelectorAll('.calendar-time-slot')
    expect(timeSlots.length).toBeGreaterThan(0)
  })

  it('displays volunteers assigned to each time slot', async () => {
    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil, bar] }), 'edition-2024')
    
    expect(el.textContent).toContain('Alice')
    expect(el.textContent).toContain('Bob')
  })

  it('renders volunteer select dropdown', async () => {
    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil, bar] }), 'edition-2024')
    
    const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
    expect(select).not.toBeNull()
    expect(select?.options.length).toBe(3) // empty + Alice + Bob
  })

  it('filters calendar by selected volunteer', async () => {
    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil, bar] }), 'edition-2024')
    
    // Select Alice from dropdown
    const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
    expect(select).not.toBeNull()
    
    const aliceOption = Array.from(select!.options).find(opt => opt.text.includes('Alice'))
    expect(aliceOption).toBeDefined()
    aliceOption!.selected = true
    select!.dispatchEvent(new Event('change', { bubbles: true }))
    
    // Should only show Alice's assignments in calendar content
    const calendarContent = el.querySelector<HTMLElement>('.calendar-content')?.textContent
    expect(calendarContent).toContain('Alice')
    expect(calendarContent).not.toContain('Bob')
  })

  it('shows all volunteers when no filter is selected', async () => {
    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil, bar] }), 'edition-2024')
    
    const content = el.querySelector<HTMLElement>('.calendar-content')?.textContent
    expect(content).toContain('Alice')
    expect(content).toContain('Bob')
  })

  it('shows empty state when no assignments exist', async () => {
    const emptySchedule = Schedule.create('edition-2024')
    await el.refresh(makeRepos({ schedule: emptySchedule, volunteers: [alice, bob], posts: [accueil, bar] }), 'edition-2024')
    
    expect(el.textContent).toContain('Aucune affectation')
  })
})
