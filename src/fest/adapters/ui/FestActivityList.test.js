// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import './FestActivityList.js'
import { Activity } from '../../domain/model/Activity.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

const repoWith = (activities) => ({ findAll: async () => activities })

describe('FestActivityList', () => {
  let el

  beforeEach(() => {
    el = document.createElement('fest-activity-list')
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
    expect(el.querySelectorAll('[data-activity-item]')).toHaveLength(2)
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
    expect(el.querySelector('button[data-action="rename-activity"]')).not.toBeNull()
    expect(el.querySelector('button[data-action="delete-activity"]')).not.toBeNull()
  })

  it('renders an add-entry button per slot', async () => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    await el.refresh(repoWith([a]))
    expect(el.querySelector('button[data-action="add-entry"]')).not.toBeNull()
  })

  it('dispatches activity-rename-requested with activityId and name', async () => {
    const a = Activity.create('Quiz')
    await el.refresh(repoWith([a]))
    const events = []
    el.addEventListener('activity-rename-requested', e => events.push(e.detail))
    el.querySelector('button[data-action="rename-activity"]').click()
    expect(events[0].activityId).toBe(a.id)
    expect(events[0].name).toBe('Quiz')
  })

  it('dispatches activity-delete-requested with activityId', async () => {
    const a = Activity.create('Quiz')
    await el.refresh(repoWith([a]))
    const events = []
    el.addEventListener('activity-delete-requested', e => events.push(e.detail))
    el.querySelector('button[data-action="delete-activity"]').click()
    expect(events[0].activityId).toBe(a.id)
  })

  it('dispatches add-entry-requested with activityId, slotId and registrations', async () => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    await el.refresh(repoWith([a]))
    const events = []
    el.addEventListener('add-entry-requested', e => events.push(e.detail))
    el.querySelector('button[data-action="add-entry"]').click()
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
