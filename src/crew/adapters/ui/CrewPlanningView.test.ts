// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { CrewPlanningView } from './CrewPlanningView'
import './CrewPlanningView'
import type { ScheduleRepository } from '../../ports/ScheduleRepository'
import type { VolunteerRepository } from '../../ports/VolunteerRepository'
import type { PostRepository } from '../../ports/PostRepository'
import { Schedule } from '../../domain/model/Schedule'
import { Volunteer } from '../../domain/model/Volunteer'
import { Post } from '../../domain/model/Post'
import { TimeWindow } from '../../domain/model/TimeWindow'
import { TimeSlot } from '../../domain/model/TimeSlot'

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

interface AssignSlotRequestedDetail {
  slotId: string
  postId: string
}

describe('CrewPlanningView', () => {
  let el: CrewPlanningView
  let alice: Volunteer
  let accueil: Post
  let satSlot: TimeSlot
  let sunSlot: TimeSlot
  let schedule: Schedule

  beforeEach(() => {
    alice = Volunteer.create('Alice')
    accueil = Post.create('Accueil', 2)
    satSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    sunSlot = accueil.addSlot(new TimeWindow('sunday', '10:00', '13:00'))
    schedule = Schedule.create('edition-2024')
    schedule.assign(alice, satSlot)
    schedule.assign(alice, sunSlot)

    el = document.createElement('crew-planning-view') as CrewPlanningView
    document.body.appendChild(el)
  })

  it('renders mode toggle buttons', async () => {
    await el.refresh(makeRepos(), 'edition-2024')
    const buttons = el.querySelectorAll<HTMLButtonElement>('button[data-mode]')
    expect(Array.from(buttons).map(b => b.dataset.mode)).toEqual(['post', 'volunteer'])
  })

  it('renders a day filter populated from the data', async () => {
    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )
    const dayButtons = el.querySelectorAll<HTMLButtonElement>('button[data-day]')
    const days = Array.from(dayButtons).map(b => b.dataset.day)
    expect(days).toContain('all')
    expect(days).toContain('saturday')
    expect(days).toContain('sunday')
  })

  it('defaults to by-post mode and all days visible', async () => {
    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )
    expect(el.querySelector<HTMLButtonElement>('button[data-mode="post"]')?.classList).toContain('active')
    expect(el.querySelector<HTMLButtonElement>('button[data-day="all"]')?.classList).toContain('active')
    expect(el.textContent).toContain('saturday')
    expect(el.textContent).toContain('sunday')
  })

  it('filters by day when a day button is clicked', async () => {
    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )
    el.querySelector<HTMLButtonElement>('button[data-day="saturday"]')?.click()

    const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
    expect(content).toContain('saturday')
    expect(content).not.toContain('sunday')
  })

  it('restores all days when "all" is clicked after a day filter', async () => {
    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )
    el.querySelector<HTMLButtonElement>('button[data-day="saturday"]')?.click()
    el.querySelector<HTMLButtonElement>('button[data-day="all"]')?.click()

    const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
    expect(content).toContain('saturday')
    expect(content).toContain('sunday')
  })

  it('keeps the day filter when switching modes', async () => {
    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )
    el.querySelector<HTMLButtonElement>('button[data-day="saturday"]')?.click()
    el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()

    const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
    expect(content).toContain('saturday')
    expect(content).not.toContain('sunday')
  })

  it('does not re-fetch when switching mode or day', async () => {
    let callCount = 0
    const repos = {
      scheduleRepo: { findByEdition: async () => { callCount++; return schedule }, save: async () => {}, findById: async () => null, findAll: async () => [], delete: async () => {} } as unknown as ScheduleRepository,
      volunteerRepo: { findAll: async () => [alice], save: async () => {}, findById: async () => null, delete: async () => {} } as unknown as VolunteerRepository,
      postRepo: { findAll: async () => [accueil], save: async () => {}, findById: async () => null, delete: async () => {} } as unknown as PostRepository,
    }
    await el.refresh(repos, 'edition-2024')
    el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
    el.querySelector<HTMLButtonElement>('button[data-day="saturday"]')?.click()

    expect(callCount).toBe(1)
  })

  it('renders empty state when no schedule exists', async () => {
    await el.refresh(makeRepos(), 'edition-2024')
    expect(el.textContent).toContain('Aucune affectation')
  })

  describe('conflict indicators', () => {
    it('shows a conflict indicator when a volunteer has overlapping slots', async () => {
      const bar = Post.create('Bar', 1)
      const conflictSlot = bar.addSlot(new TimeWindow('saturday', '11:00', '14:00'))
      schedule.assign(alice, conflictSlot)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil, bar] }),
        'edition-2024'
      )

      expect(el.querySelector<HTMLElement>('[data-conflict]')).not.toBeNull()
    })

    it('includes a tooltip describing the conflicting slot', async () => {
      const bar = Post.create('Bar', 1)
      const conflictSlot = bar.addSlot(new TimeWindow('saturday', '11:00', '14:00'))
      schedule.assign(alice, conflictSlot)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil, bar] }),
        'edition-2024'
      )

      const indicator = el.querySelector<HTMLElement>('[data-conflict]')
      expect(indicator?.getAttribute('title')).toContain('Bar')
    })

    it('shows conflict indicator in volunteer mode too', async () => {
      const bar = Post.create('Bar', 1)
      const conflictSlot = bar.addSlot(new TimeWindow('saturday', '11:00', '14:00'))
      schedule.assign(alice, conflictSlot)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil, bar] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()

      expect(el.querySelector<HTMLElement>('[data-conflict]')).not.toBeNull()
    })

    it('does not show conflict indicator when no conflicts exist', async () => {
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
        'edition-2024'
      )
      expect(el.querySelector<HTMLElement>('[data-conflict]')).toBeNull()
    })
  })

  describe('by-post mode', () => {
    it('groups assignments by day then post', async () => {
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
        'edition-2024'
      )
      expect(el.textContent).toContain('Accueil')
      expect(el.textContent).toContain('Alice')
    })
  })

  describe('by-volunteer mode', () => {
    it('shows each volunteer with their slots', async () => {
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      expect(el.textContent).toContain('Alice')
      expect(el.textContent).toContain('Accueil')
    })

    it('shows slots sorted by day then time', async () => {
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      const text = el.textContent
      expect(text?.indexOf('09:00')).toBeLessThan(text?.indexOf('10:00') ?? 0)
    })

    it('shows placeholder for volunteer with no assignment', async () => {
      const bob = Volunteer.create('Bob')
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      expect(el.textContent).toContain('Aucun créneau')
    })
  })

  describe('understaffed filter', () => {
    it('renders the understaffed filter button', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
      expect(el.querySelector<HTMLButtonElement>('button[data-filter="understaffed"]')).not.toBeNull()
    })

    it('when active, hides fully-staffed slots in by-post mode', async () => {
      const bar = Post.create('Bar', 1)
      const barSlot = bar.addSlot(new TimeWindow('saturday', '14:00', '16:00'))
      schedule.assign(alice, barSlot)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil, bar] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-filter="understaffed"]')?.click()

      const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Accueil')
      expect(content).not.toContain('Bar')
    })

    it('toggling again disables the filter', async () => {
      const bar = Post.create('Bar', 1)
      const barSlot = bar.addSlot(new TimeWindow('saturday', '14:00', '16:00'))
      schedule.assign(alice, barSlot)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil, bar] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-filter="understaffed"]')?.click()
      el.querySelector<HTMLButtonElement>('button[data-filter="understaffed"]')?.click()

      const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Bar')
    })
  })

  describe('"+" button per slot', () => {
    it('renders a "+" button per slot in by-post mode', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
      expect(el.querySelector<HTMLButtonElement>('button[data-action="add-assignment"]')).not.toBeNull()
    })

    it('dispatches assign-slot-requested with slotId and postId when clicked', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')

      const events: AssignSlotRequestedDetail[] = []
      el.addEventListener('assign-slot-requested', (e: Event) => events.push((e as CustomEvent<AssignSlotRequestedDetail>).detail))
      el.querySelector<HTMLButtonElement>('button[data-action="add-assignment"]')?.click()

      expect(events[0].slotId).toBe(satSlot.id)
      expect(events[0].postId).toBe(accueil.id)
    })

    it('does not render "+" button in by-volunteer mode', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      expect(el.querySelector<HTMLButtonElement>('button[data-action="add-assignment"]')).toBeNull()
    })
  })

  describe('volunteer filter in by-volunteer mode', () => {
    it('renders a volunteer select dropdown in volunteer mode', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      expect(el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')).not.toBeNull()
    })

    it('populates volunteer select with all volunteers', async () => {
      const bob = Volunteer.create('Bob')
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select?.querySelectorAll('option').length).toBe(3) // empty option + alice + bob
      expect(select?.textContent).toContain('Alice')
      expect(select?.textContent).toContain('Bob')
    })

    it('shows all volunteers when no volunteer is selected', async () => {
      const bob = Volunteer.create('Bob')
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Alice')
      expect(content).toContain('Bob')
    })

    it('renders volunteer select dropdown with all volunteers', async () => {
      const bob = Volunteer.create('Bob')
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      
      // Switch to volunteer mode
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select).not.toBeNull()
      expect(select?.options.length).toBe(3) // empty + Alice + Bob
      expect(select?.textContent).toContain('Alice')
      expect(select?.textContent).toContain('Bob')
    })

    it('resets volunteer filter when switching modes', async () => {
      const bob = Volunteer.create('Bob')
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select).not.toBeNull()
      select!.value = alice.id
      select?.dispatchEvent(new Event('change'))
      
      // Switch to post mode and back
      el.querySelector<HTMLButtonElement>('button[data-mode="post"]')?.click()
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      
      const selectAfter = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(selectAfter?.value).toBe('')
    })

    it('shows only selected volunteer after selection', async () => {
      const bob = Volunteer.create('Bob')
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      
      // Switch to volunteer mode - should show all volunteers
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      let content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Alice')
      expect(content).toContain('Bob')
      
      // Select Alice from dropdown
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select).not.toBeNull()
      
      // Find Alice's option and select it
      const aliceOption = Array.from(select!.options).find(opt => opt.text.includes('Alice'))
      expect(aliceOption).toBeDefined()
      aliceOption!.selected = true
      
      // Dispatch change event
      select!.dispatchEvent(new Event('change', { bubbles: true }))
      
      // Now only Alice should be visible
      content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Alice')
      expect(content).not.toContain('Bob')
    })
  })
})
