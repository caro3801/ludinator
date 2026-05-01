// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './FestAddSlotForm.js'

const makeUseCase = (result) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

const activities = [
  { id: 'a-1', name: { value: 'Quiz' } },
  { id: 'a-2', name: { value: 'Escape Game' } },
]

describe('FestAddSlotForm', () => {
  let el

  beforeEach(() => {
    el = document.createElement('fest-add-slot-form')
    document.body.appendChild(el)
    el.activities = activities
  })

  it('renders an activity selector', () => {
    expect(el.querySelector('select[name="activityId"]')).not.toBeNull()
    expect(el.querySelectorAll('select[name="activityId"] option')).toHaveLength(2)
  })

  it('renders day, startTime, endTime inputs', () => {
    expect(el.querySelector('input[name="day"]')).not.toBeNull()
    expect(el.querySelector('input[name="startTime"]')).not.toBeNull()
    expect(el.querySelector('input[name="endTime"]')).not.toBeNull()
  })

  it('renders optional min and max inputs', () => {
    expect(el.querySelector('input[name="min"]')).not.toBeNull()
    expect(el.querySelector('input[name="max"]')).not.toBeNull()
  })

  it('calls the use case with the correct data on submit', async () => {
    const useCase = makeUseCase({ id: 's-1' })
    el.addSlotToActivityUseCase = useCase
    el.querySelector('select[name="activityId"]').value = 'a-1'
    el.querySelector('input[name="day"]').value = 'saturday'
    el.querySelector('input[name="startTime"]').value = '10:00'
    el.querySelector('input[name="endTime"]').value = '12:00'
    el.querySelector('input[name="min"]').value = '5'
    el.querySelector('input[name="max"]').value = '20'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({
        activityId: 'a-1',
        day: 'saturday',
        startTime: '10:00',
        endTime: '12:00',
        min: 5,
        max: 20,
      })
    )
  })

  it('sends null min/max when fields are empty', async () => {
    const useCase = makeUseCase({ id: 's-1' })
    el.addSlotToActivityUseCase = useCase
    el.querySelector('select[name="activityId"]').value = 'a-1'
    el.querySelector('input[name="day"]').value = 'saturday'
    el.querySelector('input[name="startTime"]').value = '10:00'
    el.querySelector('input[name="endTime"]').value = '12:00'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({
        activityId: 'a-1',
        day: 'saturday',
        startTime: '10:00',
        endTime: '12:00',
        min: null,
        max: null,
      })
    )
  })

  it('dispatches slot-added on success', async () => {
    const slot = { id: 's-1' }
    el.addSlotToActivityUseCase = makeUseCase(slot)
    const events = []
    el.addEventListener('slot-added-to-activity', e => events.push(e.detail))
    el.querySelector('input[name="day"]').value = 'saturday'
    el.querySelector('input[name="startTime"]').value = '10:00'
    el.querySelector('input[name="endTime"]').value = '12:00'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(events[0]).toBe(slot))
  })

  it('resets the form after successful submission', async () => {
    el.addSlotToActivityUseCase = makeUseCase({ id: 's-1' })
    el.querySelector('input[name="day"]').value = 'saturday'
    el.querySelector('input[name="startTime"]').value = '10:00'
    el.querySelector('input[name="endTime"]').value = '12:00'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(el.querySelector('input[name="day"]').value).toBe(''))
  })

  it('dispatches fest-error on failure', async () => {
    el.addSlotToActivityUseCase = makeFailingUseCase('invalid time')
    const errors = []
    el.addEventListener('fest-error', e => errors.push(e.detail))
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(errors[0].message).toContain('invalid time'))
  })
})
