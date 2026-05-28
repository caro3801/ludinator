// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { CrewScheduleView } from './CrewScheduleView'
import './CrewScheduleView'
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

describe('CrewScheduleView', () => {
  let el: CrewScheduleView

  beforeEach(() => {
    el = document.createElement('crew-schedule-view') as CrewScheduleView
    document.body.appendChild(el)
  })

  it('renders an empty state when no schedule exists', async () => {
    await el.refresh(makeRepos(), 'edition-2024')
    expect(el.textContent).toContain('Aucune affectation')
  })

  it('renders assignments grouped by day and post', async () => {
    const alice = Volunteer.create('Alice')
    const accueil = Post.create('Accueil', 2)
    const slot: TimeSlot = accueil.addSlot(new TimeWindow('saturday', '09:00', '12:00'))

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
