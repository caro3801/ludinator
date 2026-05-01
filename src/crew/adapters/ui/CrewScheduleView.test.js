// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import './CrewScheduleView.js'
import { Schedule } from '../../domain/model/Schedule.js'
import { Volunteer } from '../../domain/model/Volunteer.js'
import { Post } from '../../domain/model/Post.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

const makeRepos = ({ schedule = null, volunteers = [], posts = [] } = {}) => ({
  scheduleRepo: { findByEdition: async () => schedule },
  volunteerRepo: { findAll: async () => volunteers },
  postRepo: { findAll: async () => posts },
})

describe('CrewScheduleView', () => {
  let el

  beforeEach(() => {
    el = document.createElement('crew-schedule-view')
    document.body.appendChild(el)
  })

  it('renders an empty state when no schedule exists', async () => {
    await el.refresh(makeRepos(), 'edition-2024')
    expect(el.textContent).toContain('Aucune affectation')
  })

  it('renders assignments grouped by day and post', async () => {
    const alice = Volunteer.create('Alice')
    const accueil = Post.create('Accueil', 2)
    const slot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))

    const schedule = Schedule.create('edition-2024')
    schedule.assign(alice, slot)

    await el.refresh(
      makeRepos({ schedule, volunteers: [alice], posts: [accueil] }),
      'edition-2024'
    )

    expect(el.textContent).toContain('saturday')
    expect(el.textContent).toContain('Accueil')
    expect(el.textContent).toContain('09:00')
    expect(el.textContent).toContain('Alice')
  })
})
