// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './CrewEditSlotForm.js'

const makeUseCase = (result) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

const slot = { id: 's-1', window: { day: 'saturday', startTime: '09:00', endTime: '12:00' } }

describe('CrewEditSlotForm', () => {
  let el

  beforeEach(() => {
    el = document.createElement('crew-edit-slot-form')
    document.body.appendChild(el)
  })

  it('is hidden by default', () => {
    expect(el.hidden).toBe(true)
  })

  it('becomes visible and pre-fills inputs when a slot is set', () => {
    el.open({ postId: 'p-1', slot })

    expect(el.hidden).toBe(false)
    expect(el.querySelector('input[name="day"]').value).toBe('saturday')
    expect(el.querySelector('input[name="startTime"]').value).toBe('09:00')
    expect(el.querySelector('input[name="endTime"]').value).toBe('12:00')
  })

  it('calls the use case with updated values on submit', async () => {
    const useCase = makeUseCase({ id: 's-1' })
    el.updateSlotInPostUseCase = useCase
    el.open({ postId: 'p-1', slot })

    el.querySelector('input[name="day"]').value = 'sunday'
    el.querySelector('input[name="startTime"]').value = '10:00'
    el.querySelector('input[name="endTime"]').value = '14:00'
    el.querySelector('form').dispatchEvent(new Event('submit'))

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
    const updated = { id: 's-1' }
    el.updateSlotInPostUseCase = makeUseCase(updated)
    el.open({ postId: 'p-1', slot })

    const events = []
    el.addEventListener('slot-updated', e => events.push(e.detail))
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => {
      expect(events[0]).toBe(updated)
      expect(el.hidden).toBe(true)
    })
  })

  it('dispatches crew-error on failure', async () => {
    el.updateSlotInPostUseCase = makeFailingUseCase('startTime must be before endTime')
    el.open({ postId: 'p-1', slot })

    const errors = []
    el.addEventListener('crew-error', e => errors.push(e.detail))
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(errors[0].message).toContain('startTime'))
  })

  it('hides itself when cancel is clicked', () => {
    el.open({ postId: 'p-1', slot })
    el.querySelector('button[data-action="cancel"]').click()
    expect(el.hidden).toBe(true)
  })
})
