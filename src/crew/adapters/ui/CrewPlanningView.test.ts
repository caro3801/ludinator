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

    it('shows available volunteers button when understaffed filter is active', async () => {
      const bar = Post.create('Bar', 1)
      const barSlot = bar.addSlot(new TimeWindow('saturday', '14:00', '16:00'))

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil, bar] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-filter="understaffed"]')?.click()

      expect(el.querySelector<HTMLButtonElement>('button[data-filter="available-volunteers"]')).not.toBeNull()
    })

    it('hides available volunteers button when understaffed filter is inactive', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')

      expect(el.querySelector<HTMLButtonElement>('button[data-filter="available-volunteers"]')).toBeNull()
    })

    it('shows available volunteers per slot when button is clicked', async () => {
      const bar = Post.create('Bar', 2) // Needs 2 volunteers
      const barSlot = bar.addSlot(new TimeWindow('saturday', '09:00', '12:00')) // Same time as accueil's satSlot
      const bob = Volunteer.create('Bob')
      const charlie = Volunteer.create('Charlie')
      // Alice is assigned to accueil's saturday 09:00-12:00 slot
      // So Alice is NOT available for bar's saturday 09:00-12:00 slot (same time)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob, charlie], posts: [accueil, bar] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-filter="understaffed"]')?.click()

      // Click available volunteers button
      const availableBtn = el.querySelector<HTMLButtonElement>('button[data-filter="available-volunteers"]')
      expect(availableBtn).not.toBeNull()
      availableBtn?.click()

      // Should show Bob and Charlie as available for the understaffed slots
      // Alice is not available for saturday 09:00-12:00 because she's already assigned to accueil at that time
      const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Bob')
      expect(content).toContain('Charlie')
    })

    it('does not show volunteer if assigned to same time slot on different post', async () => {
      const bar = Post.create('Bar', 2)
      const barSlot = bar.addSlot(new TimeWindow('saturday', '09:00', '12:00')) // Same time as accueil's satSlot
      const bob = Volunteer.create('Bob')
      // Alice is assigned to accueil saturday 09:00-12:00
      // Alice should NOT be available for bar saturday 09:00-12:00

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil, bar] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-filter="understaffed"]')?.click()

      const availableBtn = el.querySelector<HTMLButtonElement>('button[data-filter="available-volunteers"]')
      expect(availableBtn).not.toBeNull()
      availableBtn?.click()

      // Alice should NOT appear as available (already assigned to same time slot)
      // Bob should appear as available
      const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Bob')
    })

    it('shows available volunteers sorted alphabetically', async () => {
      const bar = Post.create('Bar', 2)
      const barSlot = bar.addSlot(new TimeWindow('saturday', '14:00', '16:00'))
      const charlie = Volunteer.create('Charlie')
      const bob = Volunteer.create('Bob')
      const eve = Volunteer.create('Eve')

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob, charlie, eve], posts: [accueil, bar] }),
        'edition-2024'
      )
      el.querySelector<HTMLButtonElement>('button[data-filter="understaffed"]')?.click()

      const availableBtn = el.querySelector<HTMLButtonElement>('button[data-filter="available-volunteers"]')
      expect(availableBtn).not.toBeNull()
      availableBtn?.click()

      // Available volunteers should be sorted alphabetically: Bob, Charlie, Eve
      const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Disponibles:')
      // Check that Bob appears before Charlie, and Charlie before Eve
      const bobIndex = content?.indexOf('Bob') ?? -1
      const charlieIndex = content?.indexOf('Charlie') ?? -1
      const eveIndex = content?.indexOf('Eve') ?? -1
      expect(bobIndex).toBeGreaterThan(-1)
      expect(charlieIndex).toBeGreaterThan(-1)
      expect(eveIndex).toBeGreaterThan(-1)
      expect(bobIndex).toBeLessThan(charlieIndex)
      expect(charlieIndex).toBeLessThan(eveIndex)
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

  describe('volunteer filter', () => {
    it('renders volunteer select dropdown in both modes', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
      // Should be visible in by-post mode (default)
      expect(el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')).not.toBeNull()
      
      // Should still be visible in by-volunteer mode
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      expect(el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')).not.toBeNull()
    })

    it('populates volunteer select with all volunteers', async () => {
      const bob = Volunteer.create('Bob')
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      // Select should be visible without switching mode
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select?.querySelectorAll('option').length).toBe(3) // empty option + alice + bob
      expect(select?.textContent).toContain('Alice')
      expect(select?.textContent).toContain('Bob')
    })

    it('shows all volunteers when no volunteer is selected in by-post mode', async () => {
      const bob = Volunteer.create('Bob')
      schedule.assign(bob, satSlot) // Assign Bob to saturday slot
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Alice')
      expect(content).toContain('Bob')
    })

    it('filters by volunteer in by-post mode', async () => {
      const bob = Volunteer.create('Bob')
      schedule.assign(bob, satSlot) // Assign Bob to saturday slot
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      
      // Both volunteers should be visible initially
      let content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Alice')
      expect(content).toContain('Bob')
      
      // Select Bob from dropdown
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select).not.toBeNull()
      
      const bobOption = Array.from(select!.options).find(opt => opt.text.includes('Bob'))
      expect(bobOption).toBeDefined()
      bobOption!.selected = true
      select!.dispatchEvent(new Event('change', { bubbles: true }))
      
      // Only Bob's assignments should be visible
      content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Bob')
      expect(content).not.toContain('Alice')
    })

    it('filters by volunteer in by-volunteer mode', async () => {
      const bob = Volunteer.create('Bob')
      schedule.assign(bob, satSlot) // Assign Bob to saturday slot
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      
      // Switch to volunteer mode
      el.querySelector<HTMLButtonElement>('button[data-mode="volunteer"]')?.click()
      
      // Both volunteers should be visible
      let content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Alice')
      expect(content).toContain('Bob')
      
      // Select Alice from dropdown
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select).not.toBeNull()
      
      const aliceOption = Array.from(select!.options).find(opt => opt.text.includes('Alice'))
      expect(aliceOption).toBeDefined()
      aliceOption!.selected = true
      select!.dispatchEvent(new Event('change', { bubbles: true }))
      
      // Only Alice should be visible
      content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Alice')
      expect(content).not.toContain('Bob')
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

    it('in by-post mode, only shows posts with selected volunteer', async () => {
      const bar = Post.create('Bar', 1)
      const barSlot = bar.addSlot(new TimeWindow('saturday', '14:00', '16:00'))
      const bob = Volunteer.create('Bob')
      schedule.assign(bob, barSlot) // Bob is only assigned to Bar, not Accueil

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil, bar] }),
        'edition-2024'
      )

      // In by-post mode (default), both posts should be visible
      let content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Accueil')
      expect(content).toContain('Bar')

      // Select Bob from dropdown
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select).not.toBeNull()
      const bobOption = Array.from(select!.options).find(opt => opt.text.includes('Bob'))
      expect(bobOption).toBeDefined()
      bobOption!.selected = true
      select!.dispatchEvent(new Event('change', { bubbles: true }))

      // Only Bar should be visible (where Bob is assigned), not Accueil
      content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Bar')
      expect(content).toContain('Bob')
      expect(content).not.toContain('Accueil')
    })

    it('in by-post mode, only shows slots where selected volunteer is assigned', async () => {
      const bar = Post.create('Bar', 1)
      const barSlot1 = bar.addSlot(new TimeWindow('saturday', '14:00', '16:00'))
      const barSlot2 = bar.addSlot(new TimeWindow('sunday', '14:00', '16:00'))
      const bob = Volunteer.create('Bob')
      schedule.assign(alice, barSlot1) // Alice is assigned to Bar slot 1
      schedule.assign(bob, barSlot2) // Bob is assigned to Bar slot 2

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [bar] }),
        'edition-2024'
      )

      // Select Alice from dropdown
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select).not.toBeNull()
      const aliceOption = Array.from(select!.options).find(opt => opt.text.includes('Alice'))
      aliceOption!.selected = true
      select!.dispatchEvent(new Event('change', { bubbles: true }))

      // Only Bar slot 1 (14:00-16:00 saturday) should be visible, not slot 2
      const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('14:00–16:00')
      expect(content).toContain('Alice')
      expect(content).not.toContain('Bob')
    })

    it('shows all posts when volunteer filter is reset to empty', async () => {
      const bar = Post.create('Bar', 1)
      const barSlot = bar.addSlot(new TimeWindow('saturday', '14:00', '16:00'))
      const bob = Volunteer.create('Bob')
      schedule.assign(bob, barSlot)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil, bar] }),
        'edition-2024'
      )

      // Select Bob to filter
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select).not.toBeNull()
      select!.value = bob.id
      select!.dispatchEvent(new Event('change', { bubbles: true }))

      // Only Bar should be visible
      let content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Bar')
      expect(content).not.toContain('Accueil')

      // Reset to empty (show all)
      select!.value = ''
      select!.dispatchEvent(new Event('change', { bubbles: true }))

      // Both posts should be visible again
      content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Accueil')
      expect(content).toContain('Bar')
    })

    it('shows no assignment message when selected volunteer has no assignments', async () => {
      const bob = Volunteer.create('Bob')
      // Bob has no assignments

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )

      // Select Bob (no assignments)
      const select = el.querySelector<HTMLSelectElement>('select[data-filter="volunteer"]')
      expect(select).not.toBeNull()
      select!.value = bob.id
      select!.dispatchEvent(new Event('change', { bubbles: true }))

      // Should show no assignment message
      const content = el.querySelector<HTMLElement>('.planning-content')?.textContent
      expect(content).toContain('Aucune affectation')
    })
  })
})
