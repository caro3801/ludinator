// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { FestActivityList } from './FestActivityList'
import './FestActivityList'
import { Activity } from '../../domain/model/Activity'
import { TimeWindow } from '../../domain/model/TimeWindow'
import type { ActivityRepository } from '../../ports/ActivityRepository'

const repoWith = (activities: Activity[]): ActivityRepository => ({ findAll: async () => activities } as unknown as ActivityRepository)

describe('FestActivityList', () => {
  let el: FestActivityList

  beforeEach(() => {
    el = document.createElement('fest-activity-list') as FestActivityList
    document.body.appendChild(el)
  })

  it('renders empty state when no activities', async () => {
    await el.refresh(repoWith([]))
    expect(el.textContent).toContain('Aucune activité')
  })

  it('renders an item per activity', async () => {
    const a1 = Activity.create('Quiz')
    const a2 = Activity.create('Escape Game')
    await el.refresh(repoWith([a1, a2]))
    expect(Array.from(el.querySelectorAll('[data-activity-item]'))).toHaveLength(2)
    expect(el.textContent).toContain('Quiz')
    expect(el.textContent).toContain('Escape Game')
  })

  it('shows the location when present', async () => {
    const a = Activity.create('Quiz', 'Salle B')
    await el.refresh(repoWith([a]))
    expect(el.textContent).toContain('Salle B')
  })

  it('renders slots with registration count', async () => {
    const a = Activity.create('Quiz')
    const slot = a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    slot.addRegistration('Alice')
    slot.addRegistration('Bob')
    await el.refresh(repoWith([a]))
    expect(el.textContent).toContain('10:00')
    expect(el.textContent).toContain('2')
  })

  it('renders rename and delete buttons per activity', async () => {
    await el.refresh(repoWith([Activity.create('Quiz')]))
    expect(el.querySelector<HTMLButtonElement>('button[data-action="rename-activity"]')).not.toBeNull()
    expect(el.querySelector<HTMLButtonElement>('button[data-action="delete-activity"]')).not.toBeNull()
  })

  it('renders an add-entry button per slot', async () => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    await el.refresh(repoWith([a]))
    expect(el.querySelector<HTMLButtonElement>('button[data-action="add-entry"]')).not.toBeNull()
  })

  it('dispatches activity-rename-requested with activityId and name', async () => {
    const a = Activity.create('Quiz')
    await el.refresh(repoWith([a]))
    const events: { activityId: string; name: string }[] = []
    el.addEventListener('activity-rename-requested', (e: Event) => events.push((e as CustomEvent<{ activityId: string; name: string }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="rename-activity"]')?.click()
    expect(events[0].activityId).toBe(a.id)
    expect(events[0].name).toBe('Quiz')
  })

  it('dispatches activity-delete-requested with activityId', async () => {
    const a = Activity.create('Quiz')
    await el.refresh(repoWith([a]))
    const events: { activityId: string }[] = []
    el.addEventListener('activity-delete-requested', (e: Event) => events.push((e as CustomEvent<{ activityId: string }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="delete-activity"]')?.click()
    expect(events[0].activityId).toBe(a.id)
  })

  it('dispatches add-entry-requested with activityId, slotId and registrations', async () => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    await el.refresh(repoWith([a]))
    const events: { activityId: string; slotId: string; registrations: unknown[] }[] = []
    el.addEventListener('add-entry-requested', (e: Event) => events.push((e as CustomEvent<{ activityId: string; slotId: string; registrations: unknown[] }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="add-entry"]')?.click()
    expect(events[0].activityId).toBe(a.id)
    expect(events[0].slotId).toBe(a.slots[0].id)
    expect(Array.isArray(events[0].registrations)).toBe(true)
  })

  it('replaces the list on subsequent refresh calls', async () => {
    await el.refresh(repoWith([Activity.create('Quiz')]))
    await el.refresh(repoWith([Activity.create('Escape Game')]))
    expect(el.textContent).not.toContain('Quiz')
    expect(el.textContent).toContain('Escape Game')
  })
})
