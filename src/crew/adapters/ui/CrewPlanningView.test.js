// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import './CrewPlanningView.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

const makeRepos = ({ schedule = null, volunteers = [], posts = [] } = {}) => ({
  scheduleRepo: { findByEdition: async () => schedule },
  volunteerRepo: { findAll: async () => volunteers },
  postRepo: { findAll: async () => posts },
})

describe('CrewPlanningView', () => {
  let el, alice, accueil, satSlot, sunSlot, schedule

  beforeEach(() => {
    alice = Volunteer.create('Alice')
    accueil = Post.create('Accueil', 2)
    satSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    sunSlot = accueil.addSlot(new TimeWindow('sunday', '10:00', '13:00'))
    schedule = Schedule.create('edition-2024')
    schedule.assign(alice, satSlot)
    schedule.assign(alice, sunSlot)

    el = document.createElement('crew-planning-view')
    document.body.appendChild(el)
  })

  it('renders mode toggle buttons', async () => {
    await el.refresh(makeRepos(), 'edition-2024')
    const buttons = el.querySelectorAll('button[data-mode]')
    expect([...buttons].map(b => b.dataset.mode)).toEqual(['post', 'volunteer'])
  })

  it('renders a day filter populated from the data', async () => {
    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )
    const dayButtons = el.querySelectorAll('button[data-day]')
    const days = [...dayButtons].map(b => b.dataset.day)
    expect(days).toContain('all')
    expect(days).toContain('saturday')
    expect(days).toContain('sunday')
  })

  it('defaults to by-post mode and all days visible', async () => {
    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )
    expect(el.querySelector('button[data-mode="post"]').classList).toContain('active')
    expect(el.querySelector('button[data-day="all"]').classList).toContain('active')
    expect(el.textContent).toContain('saturday')
    expect(el.textContent).toContain('sunday')
  })

  it('filters by day when a day button is clicked', async () => {
    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )
    el.querySelector('button[data-day="saturday"]').click()

    const content = el.querySelector('.planning-content').textContent
    expect(content).toContain('saturday')
    expect(content).not.toContain('sunday')
  })

  it('restores all days when "all" is clicked after a day filter', async () => {
    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )
    el.querySelector('button[data-day="saturday"]').click()
    el.querySelector('button[data-day="all"]').click()

    const content = el.querySelector('.planning-content').textContent
    expect(content).toContain('saturday')
    expect(content).toContain('sunday')
  })

  it('keeps the day filter when switching modes', async () => {
    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )
    el.querySelector('button[data-day="saturday"]').click()
    el.querySelector('button[data-mode="volunteer"]').click()

    const content = el.querySelector('.planning-content').textContent
    expect(content).toContain('saturday')
    expect(content).not.toContain('sunday')
  })

  it('does not re-fetch when switching mode or day', async () => {
    let callCount = 0
    const repos = {
      scheduleRepo: { findByEdition: async () => { callCount++; return schedule } },
      volunteerRepo: { findAll: async () => [alice] },
      postRepo: { findAll: async () => [accueil] },
    }
    await el.refresh(repos, 'edition-2024')
    el.querySelector('button[data-mode="volunteer"]').click()
    el.querySelector('button[data-day="saturday"]').click()

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

      expect(el.querySelector('[data-conflict]')).not.toBeNull()
    })

    it('includes a tooltip describing the conflicting slot', async () => {
      const bar = Post.create('Bar', 1)
      const conflictSlot = bar.addSlot(new TimeWindow('saturday', '11:00', '14:00'))
      schedule.assign(alice, conflictSlot)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil, bar] }),
        'edition-2024'
      )

      const indicator = el.querySelector('[data-conflict]')
      expect(indicator.title).toContain('Bar')
    })

    it('shows conflict indicator in volunteer mode too', async () => {
      const bar = Post.create('Bar', 1)
      const conflictSlot = bar.addSlot(new TimeWindow('saturday', '11:00', '14:00'))
      schedule.assign(alice, conflictSlot)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil, bar] }),
        'edition-2024'
      )
      el.querySelector('button[data-mode="volunteer"]').click()

      expect(el.querySelector('[data-conflict]')).not.toBeNull()
    })

    it('does not show conflict indicator when no conflicts exist', async () => {
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
        'edition-2024'
      )
      expect(el.querySelector('[data-conflict]')).toBeNull()
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
      el.querySelector('button[data-mode="volunteer"]').click()
      expect(el.textContent).toContain('Alice')
      expect(el.textContent).toContain('Accueil')
    })

    it('shows slots sorted by day then time', async () => {
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
        'edition-2024'
      )
      el.querySelector('button[data-mode="volunteer"]').click()
      const text = el.textContent
      expect(text.indexOf('09:00')).toBeLessThan(text.indexOf('10:00'))
    })

    it('shows placeholder for volunteer with no assignment', async () => {
      const bob = Volunteer.create('Bob')
      await el.refresh(
        makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
        'edition-2024'
      )
      el.querySelector('button[data-mode="volunteer"]').click()
      expect(el.textContent).toContain('Aucun créneau')
    })
  })

  describe('understaffed filter', () => {
    it('renders the understaffed filter button', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
      expect(el.querySelector('button[data-filter="understaffed"]')).not.toBeNull()
    })

    it('when active, hides fully-staffed slots in by-post mode', async () => {
      // bar has minVolunteers=1, alice is assigned → fully staffed
      const bar = Post.create('Bar', 1)
      const barSlot = bar.addSlot(new TimeWindow('saturday', '14:00', '16:00'))
      schedule.assign(alice, barSlot)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil, bar] }),
        'edition-2024'
      )
      el.querySelector('button[data-filter="understaffed"]').click()

      const content = el.querySelector('.planning-content').textContent
      expect(content).toContain('Accueil') // minVolunteers=2, only 1 assigned → understaffed
      expect(content).not.toContain('Bar')  // minVolunteers=1, 1 assigned → fully staffed
    })

    it('toggling again disables the filter', async () => {
      const bar = Post.create('Bar', 1)
      const barSlot = bar.addSlot(new TimeWindow('saturday', '14:00', '16:00'))
      schedule.assign(alice, barSlot)

      await el.refresh(
        makeRepos({ schedule, volunteers: [alice], posts: [accueil, bar] }),
        'edition-2024'
      )
      el.querySelector('button[data-filter="understaffed"]').click()
      el.querySelector('button[data-filter="understaffed"]').click()

      const content = el.querySelector('.planning-content').textContent
      expect(content).toContain('Bar')
    })
  })

  describe('"+" button per slot', () => {
    it('renders a "+" button per slot in by-post mode', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
      expect(el.querySelector('button[data-action="add-assignment"]')).not.toBeNull()
    })

    it('dispatches assign-slot-requested with slotId and postId when clicked', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')

      const events = []
      el.addEventListener('assign-slot-requested', e => events.push(e.detail))
      el.querySelector('button[data-action="add-assignment"]').click()

      expect(events[0].slotId).toBe(satSlot.id)
      expect(events[0].postId).toBe(accueil.id)
    })

    it('does not render "+" button in by-volunteer mode', async () => {
      await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
      el.querySelector('button[data-mode="volunteer"]').click()
      expect(el.querySelector('button[data-action="add-assignment"]')).toBeNull()
    })
  })
})
