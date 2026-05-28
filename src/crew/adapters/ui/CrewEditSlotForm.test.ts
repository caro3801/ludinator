// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CrewEditSlotForm } from './CrewEditSlotForm'
import './CrewEditSlotForm'

interface Slot {
  id: string
  window: { day: string, startTime: string, endTime: string }
}

const makeUseCase = <T>(result: T) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg: string) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

const slot: Slot = { id: 's-1', window: { day: 'saturday', startTime: '09:00', endTime: '12:00' } }

describe('CrewEditSlotForm', () => {
  let el: CrewEditSlotForm

  beforeEach(() => {
    el = document.createElement('crew-edit-slot-form') as CrewEditSlotForm
    document.body.appendChild(el)
  })

  it('is hidden by default', () => {
    expect(el.hidden).toBe(true)
  })

  it('becomes visible and pre-fills inputs when a slot is set', () => {
    el.open({ postId: 'p-1', slot })

    expect(el.hidden).toBe(false)
    expect(el.querySelector<HTMLInputElement>('input[name="day"]')?.value).toBe('saturday')
    expect(el.querySelector<HTMLInputElement>('input[name="startTime"]')?.value).toBe('09:00')
    expect(el.querySelector<HTMLInputElement>('input[name="endTime"]')?.value).toBe('12:00')
  })

  it('calls the use case with updated values on submit', async () => {
    const useCase = makeUseCase({ id: 's-1' })
    el.updateSlotInPostUseCase = useCase
    el.open({ postId: 'p-1', slot })

    el.querySelector<HTMLInputElement>('input[name="day"]')!.value = 'sunday'
    el.querySelector<HTMLInputElement>('input[name="startTime"]')!.value = '10:00'
    el.querySelector<HTMLInputElement>('input[name="endTime"]')!.value = '14:00'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({
        postId: 'p-1',
        slotId: 's-1',
        day: 'sunday',
        startTime: '10:00',
        endTime: '14:00',
      })
    )
  })

  it('dispatches slot-updated and hides itself on success', async () => {
    el.updateSlotInPostUseCase = makeUseCase({ id: 's-1' })
    el.open({ postId: 'p-1', slot })

    const events: unknown[] = []
    el.addEventListener('slot-updated', (e: Event) => events.push((e as CustomEvent).detail))

    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(events).toHaveLength(1))
    expect(el.hidden).toBe(true)
  })

  it('dispatches crew-error on failure', async () => {
    el.updateSlotInPostUseCase = makeFailingUseCase('Start time must be before end time')
    el.open({ postId: 'p-1', slot })

    const errors: { message: string }[] = []
    el.addEventListener('crew-error', (e: Event) => errors.push((e as CustomEvent<{ message: string }>).detail))

    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(errors).toHaveLength(1))
    expect(errors[0].message).toContain('before')
  })

  it('hides itself when cancel is clicked', () => {
    el.open({ postId: 'p-1', slot })
    expect(el.hidden).toBe(false)

    el.querySelector<HTMLButtonElement>('button[type="button"]')?.click()
    expect(el.hidden).toBe(true)
  })
})
