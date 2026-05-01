// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import './CrewStatsView.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

const makeRepos = ({ schedule = null, volunteers = [] } = {}) => ({
  scheduleRepo: { findByEdition: async () => schedule },
  volunteerRepo: { findAll: async () => volunteers },
})

describe('CrewStatsView', () => {
  let el, alice, bob, accueil, schedule

  beforeEach(() => {
    alice = Volunteer.create('Alice')
    bob = Volunteer.create('Bob')
    accueil = Post.create('Accueil', 2)
    schedule = Schedule.create('edition-2024')

    el = document.createElement('crew-stats-view')
    document.body.appendChild(el)
  })

  it('renders an empty state when no schedule exists', async () => {
    await el.refresh(makeRepos(), 'edition-2024')
    expect(el.textContent).toContain('Aucune donnée')
  })

  it('renders a row per volunteer', async () => {
    const slot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(alice, slot)

    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob] }), 'edition-2024')
    expect(el.querySelectorAll('tr[data-volunteer-id]')).toHaveLength(2)
  })

  it('shows volunteer name', async () => {
    const slot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(alice, slot)

    await el.refresh(makeRepos({ schedule, volunteers: [alice] }), 'edition-2024')
    expect(el.textContent).toContain('Alice')
  })

  it('shows total hours for a volunteer', async () => {
    const slot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(alice, slot)

    await el.refresh(makeRepos({ schedule, volunteers: [alice] }), 'edition-2024')
    expect(el.textContent).toContain('3')
  })

  it('accumulates hours across multiple slots', async () => {
    const s1 = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    const s2 = accueil.addSlot(new TimeWindow('sunday', '14:00', '17:30'))
    schedule.assign(alice, s1)
    schedule.assign(alice, s2)

    await el.refresh(makeRepos({ schedule, volunteers: [alice] }), 'edition-2024')
    expect(el.textContent).toContain('6.5')
  })

  it('shows 0h for volunteer with no assignment', async () => {
    await el.refresh(makeRepos({ schedule, volunteers: [alice] }), 'edition-2024')
    const row = el.querySelector('tr[data-volunteer-id]')
    expect(row.textContent).toContain('0')
  })

  it('sorts volunteers by total hours descending', async () => {
    const s1 = accueil.addSlot(new TimeWindow('saturday', '09:00', '10:00'))
    const s2 = accueil.addSlot(new TimeWindow('saturday', '10:00', '14:00'))
    schedule.assign(alice, s1) // 1h
    schedule.assign(bob, s2)   // 4h

    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob] }), 'edition-2024')
    const rows = [...el.querySelectorAll('tr[data-volunteer-id]')]
    expect(rows[0].textContent).toContain('Bob')
    expect(rows[1].textContent).toContain('Alice')
  })
})
