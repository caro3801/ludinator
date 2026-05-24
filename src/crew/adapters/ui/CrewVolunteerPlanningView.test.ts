// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { CrewVolunteerPlanningView } from './CrewVolunteerPlanningView'
import './CrewVolunteerPlanningView'
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

describe('CrewVolunteerPlanningView', () => {
  let el: CrewVolunteerPlanningView

  beforeEach(() => {
    el = document.createElement('crew-volunteer-planning-view') as CrewVolunteerPlanningView
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
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))

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
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))

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
    const afternoon: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '14:00', '17:00'))
    const morning: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))

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
