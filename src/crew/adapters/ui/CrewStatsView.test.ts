// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CrewStatsView } from './CrewStatsView'
import './CrewStatsView'
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

describe('CrewStatsView', () => {
  let el: CrewStatsView
  let alice: Volunteer
  let bob: Volunteer
  let accueil: Post
  let schedule: Schedule

  beforeEach(() => {
    alice = Volunteer.create('Alice')
    bob = Volunteer.create('Bob')
    accueil = Post.create('Accueil', 2)
    schedule = Schedule.create('edition-2024')

    el = document.createElement('crew-stats-view') as CrewStatsView
    document.body.appendChild(el)
  })

  it('renders an empty state when no schedule exists', async () => {
    await el.refresh(makeRepos(), 'edition-2024')
    expect(el.textContent).toContain('Aucune donnée')
  })

  it('renders a row per volunteer', async () => {
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(alice, slot)

    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }), 'edition-2024')
    expect(el.querySelectorAll<HTMLTableRowElement>('tr[data-volunteer-id]')).toHaveLength(2)
  })

  it('shows volunteer name', async () => {
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(alice, slot)

    await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
    expect(el.textContent).toContain('Alice')
  })

  it('shows total hours for a volunteer', async () => {
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(alice, slot)

    await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
    expect(el.textContent).toContain('3h')
  })

  it('shows total volunteers assigned', async () => {
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(alice, slot)

    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }), 'edition-2024')
    expect(el.textContent).toContain('1 / 2')
  })

  it('shows post coverage information', async () => {
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(alice, slot)

    await el.refresh(makeRepos({ schedule, volunteers: [alice], posts: [accueil] }), 'edition-2024')
    expect(el.textContent).toContain('Accueil')
    expect(el.textContent).toContain('1 / 2')
  })

  it('marks posts as fully staffed when all slots are filled', async () => {
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(alice, slot)
    schedule.assign(bob, slot)

    await el.refresh(makeRepos({ schedule, volunteers: [alice, bob], posts: [accueil] }), 'edition-2024')
    const row = el.querySelector<HTMLTableRowElement>('tr[data-post-id]')
    expect(row?.textContent).toContain('Complet')
  })

  it('marks posts as understaffed when slots remain', async () => {
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))

    await el.refresh(makeRepos({ schedule, volunteers: [], posts: [accueil] }), 'edition-2024')
    const row = el.querySelector<HTMLTableRowElement>('tr[data-post-id]')
    expect(row?.textContent).toContain('Incomplet')
  })

  it('calls postRepo.findAll() to display post coverage stats', async () => {
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
    schedule.assign(alice, slot)

    const mockPostRepo = {
      findAll: vi.fn().mockResolvedValue([accueil]),
      save: async () => {},
      findById: async () => null,
      delete: async () => {}
    }

    await el.refresh(
      {
        scheduleRepo: { findByEdition: async () => schedule, save: async () => {}, findById: async () => null, findAll: async () => [], delete: async () => {} } as unknown as ScheduleRepository,
        volunteerRepo: { findAll: async () => [alice], save: async () => {}, findById: async () => null, delete: async () => {} } as unknown as VolunteerRepository,
        postRepo: mockPostRepo as unknown as PostRepository
      },
      'edition-2024'
    )

    expect(mockPostRepo.findAll).toHaveBeenCalledTimes(1)
  })
})
