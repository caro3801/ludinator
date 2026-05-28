// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FestAddSlotForm } from './FestAddSlotForm'
import './FestAddSlotForm'

const makeUseCase = <T>(result: T) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg: string) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

interface ActivityType {
  id: string
  name: { value: string }
}

const activities: ActivityType[] = [
  { id: 'a-1', name: { value: 'Quiz' } },
  { id: 'a-2', name: { value: 'Escape Game' } },
]

describe('FestAddSlotForm', () => {
  let el: FestAddSlotForm

  beforeEach(() => {
    el = document.createElement('fest-add-slot-form') as FestAddSlotForm
    document.body.appendChild(el)
    el.activities = activities
  })

  it('renders an activity selector', () => {
    expect(el.querySelector<HTMLSelectElement>('select[name="activityId"]')).not.toBeNull()
    expect(Array.from(el.querySelectorAll<HTMLOptionElement>('select[name="activityId"] option'))).toHaveLength(2)
  })

  it('renders day, startTime, endTime inputs', () => {
    expect(el.querySelector<HTMLInputElement>('input[name="day"]')).not.toBeNull()
    expect(el.querySelector<HTMLInputElement>('input[name="startTime"]')).not.toBeNull()
    expect(el.querySelector<HTMLInputElement>('input[name="endTime"]')).not.toBeNull()
  })

  it('renders optional min and max inputs', () => {
    expect(el.querySelector<HTMLInputElement>('input[name="min"]')).not.toBeNull()
    expect(el.querySelector<HTMLInputElement>('input[name="max"]')).not.toBeNull()
  })

  it('calls the use case with the correct data on submit', async () => {
    const useCase = makeUseCase({ id: 's-1' })
    el.addSlotToActivityUseCase = useCase
    el.querySelector<HTMLSelectElement>('select[name="activityId"]')!.value = 'a-1'
    el.querySelector<HTMLInputElement>('input[name="day"]')!.value = 'saturday'
    el.querySelector<HTMLInputElement>('input[name="startTime"]')!.value = '10:00'
    el.querySelector<HTMLInputElement>('input[name="endTime"]')!.value = '12:00'
    el.querySelector<HTMLInputElement>('input[name="min"]')!.value = '5'
    el.querySelector<HTMLInputElement>('input[name="max"]')!.value = '20'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
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
    el.querySelector<HTMLSelectElement>('select[name="activityId"]')!.value = 'a-1'
    el.querySelector<HTMLInputElement>('input[name="day"]')!.value = 'saturday'
    el.querySelector<HTMLInputElement>('input[name="startTime"]')!.value = '10:00'
    el.querySelector<HTMLInputElement>('input[name="endTime"]')!.value = '12:00'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
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
    const events: { id: string }[] = []
    el.addEventListener('slot-added-to-activity', (e: Event) => events.push((e as CustomEvent<{ id: string }>).detail))
    el.querySelector<HTMLInputElement>('input[name="day"]')!.value = 'saturday'
    el.querySelector<HTMLInputElement>('input[name="startTime"]')!.value = '10:00'
    el.querySelector<HTMLInputElement>('input[name="endTime"]')!.value = '12:00'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(events[0]).toBe(slot))
  })

  it('resets the form after successful submission', async () => {
    el.addSlotToActivityUseCase = makeUseCase({ id: 's-1' })
    el.querySelector<HTMLInputElement>('input[name="day"]')!.value = 'saturday'
    el.querySelector<HTMLInputElement>('input[name="startTime"]')!.value = '10:00'
    el.querySelector<HTMLInputElement>('input[name="endTime"]')!.value = '12:00'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(el.querySelector<HTMLInputElement>('input[name="day"]')?.value).toBe(''))
  })

  it('dispatches fest-error on failure', async () => {
    el.addSlotToActivityUseCase = makeFailingUseCase('invalid time')
    const errors: { message: string }[] = []
    el.addEventListener('fest-error', (e: Event) => errors.push((e as CustomEvent<{ message: string }>).detail))
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(errors[0].message).toContain('invalid time'))
  })
})
