// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import './CrewVolunteerPlanningView.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

const makeRepos = ({ schedule = null, volunteers = [], posts = [] } = {}) => ({
  scheduleRepo: { findByEdition: async () => schedule },
  volunteerRepo: { findAll: async () => volunteers },
  postRepo: { findAll: async () => posts },
})

describe('CrewVolunteerPlanningView', () => {
  let el

  beforeEach(() => {
    el = document.createElement('crew-volunteer-planning-view')
    document.body.appendChild(el)
  })

  it('renders an empty state when no schedule exists', async () => {
    await el.refresh(makeRepos(), 'edition-2024')
    expect(el.textContent).toContain('Aucune affectation')
  })

  it('renders a section for each volunteer', async () => {
    const alice = Volunteer.create('Alice')
    const bob = Volunteer.create('Bob')
    const accueil = Post.create('Accueil', 2)
    const slot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))

    const schedule = Schedule.create('edition-2024')
    schedule.assign(alice, slot)

    await el.refresh(
      makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }),
      'edition-2024'
    )

    expect(el.textContent).toContain('Alice')
    expect(el.textContent).toContain('Bob')
  })

  it('shows assigned slots for a volunteer with post name and time', async () => {
    const alice = Volunteer.create('Alice')
    const accueil = Post.create('Accueil', 2)
    const slot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))

    const schedule = Schedule.create('edition-2024')
    schedule.assign(alice, slot)

    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )

    expect(el.textContent).toContain('Accueil')
    expect(el.textContent).toContain('saturday')
    expect(el.textContent).toContain('09:00')
    expect(el.textContent).toContain('12:00')
  })

  it('shows a placeholder when a volunteer has no assignment', async () => {
    const alice = Volunteer.create('Alice')
    const schedule = Schedule.create('edition-2024')

    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [] }),
      'edition-2024'
    )

    expect(el.textContent).toContain('Alice')
    expect(el.textContent).toContain('Aucun créneau')
  })

  it('renders slots sorted by day then startTime', async () => {
    const alice = Volunteer.create('Alice')
    const accueil = Post.create('Accueil', 2)
    const afternoon = accueil.addSlot(new TimeWindow('saturday', '14:00', '17:00'))
    const morning = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))

    const schedule = Schedule.create('edition-2024')
    schedule.assign(alice, afternoon)
    schedule.assign(alice, morning)

    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )

    const text = el.textContent
    expect(text.indexOf('09:00')).toBeLessThan(text.indexOf('14:00'))
  })
})
