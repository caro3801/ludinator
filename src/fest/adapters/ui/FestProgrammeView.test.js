// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import './FestProgrammeView.js'
import { Activity } from '../../domain/model/Activity.js'
import { TimeWindow } from '../../domain/model/TimeWindow.js'

const repoWith = (activities) => ({ findAll: async () => activities })

const AT_10H = () => '10:00'
const AT_14H = () => '14:00'

describe('FestProgrammeView', () => {
  let el

  beforeEach(() => {
    el = document.createElement('fest-programme-view')
    document.body.appendChild(el)
  })

  it('shows empty state when no activities', async () => {
    await el.refresh(repoWith([]), { nowFn: AT_10H })
    expect(el.textContent).toContain('Aucune activité')
  })

  it('renders each activity slot', async () => {
    const a = Activity.create('Quiz', 'Salle A')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    await el.refresh(repoWith([a]), { nowFn: AT_10H })
    expect(el.textContent).toContain('Quiz')
    expect(el.textContent).toContain('Salle A')
    expect(el.textContent).toContain('10:00')
  })

  it('groups slots by day', async () => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '10:00', '12:00'))
    a.addSlot(new TimeWindow('sunday', '14:00', '16:00'))
    await el.refresh(repoWith([a]), { nowFn: AT_10H })
    expect(el.querySelectorAll('[data-day]')).toHaveLength(2)
  })

  it('sorts slots within a day by startTime', async () => {
    const a = Activity.create('Quiz')
    a.addSlot(new TimeWindow('saturday', '14:00', '16:00'))
    a.addSlot(new TimeWindow('saturday', '09:00', '11:00'))
    await el.refresh(repoWith([a]), { nowFn: AT_10H })
    const slots = el.querySelectorAll('[data-slot]')
    expect(slots[0].textContent).toContain('09:00')
    expect(slots[1].textContent).toContain('14:00')
  })

  it('shows registration count', async () => {
    const a = Activity.create('Quiz')
    const slot = a.addSlot(new TimeWindow('saturday', '10:00', '12:00'), { max: 20 })
    slot.addRegistration('Alice')
    slot.addRegistration('Bob')
    await el.refresh(repoWith([a]), { nowFn: AT_10H })
    expect(el.textContent).toContain('2')
    expect(el.textContent).toContain('20')
  })

  it('marks over-capacity slots visually', async () => {
    const a = Activity.create('Quiz')
    const slot = a.addSlot(new TimeWindow('saturday', '10:00', '12:00'), { max: 1 })
    slot.addRegistration('Alice')
    slot.addRegistration('Bob') // waitlisted
    await el.refresh(repoWith([a]), { nowFn: AT_10H })
    expect(el.querySelector('[data-overcapacity]')).not.toBeNull()
  })

  it('renders a hide-past toggle button', async () => {
    await el.refresh(repoWith([]), { nowFn: AT_10H })
    expect(el.querySelector('button[data-action="toggle-past"]')).not.toBeNull()
  })

  describe('hide past filter', () => {
    let activity

    beforeEach(async () => {
      activity = Activity.create('Quiz')
      activity.addSlot(new TimeWindow('saturday', '09:00', '10:00')) // ends at 10:00 → past at 14:00
      activity.addSlot(new TimeWindow('saturday', '13:00', '15:00')) // ends at 15:00 → future at 14:00
      await el.refresh(repoWith([activity]), { nowFn: AT_14H })
    })

    it('shows all slots by default', () => {
      expect(el.querySelectorAll('[data-slot]')).toHaveLength(2)
    })

    it('hides past slots when filter is toggled on', () => {
      el.querySelector('button[data-action="toggle-past"]').click()
      expect(el.querySelectorAll('[data-slot]')).toHaveLength(1)
      expect(el.textContent).not.toContain('09:00')
      expect(el.textContent).toContain('13:00')
    })

    it('restores all slots when filter is toggled off again', () => {
      el.querySelector('button[data-action="toggle-past"]').click()
      el.querySelector('button[data-action="toggle-past"]').click()
      expect(el.querySelectorAll('[data-slot]')).toHaveLength(2)
    })

    it('a slot ending exactly at current time is considered past', async () => {
      const a = Activity.create('Test')
      a.addSlot(new TimeWindow('saturday', '13:00', '14:00'))
      await el.refresh(repoWith([a]), { nowFn: AT_14H })
      el.querySelector('button[data-action="toggle-past"]').click()
      expect(el.querySelectorAll('[data-slot]')).toHaveLength(0)
    })
  })
})
