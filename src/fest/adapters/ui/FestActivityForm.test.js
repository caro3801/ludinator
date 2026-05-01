// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './FestActivityForm.js'

const makeUseCase = (result) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

describe('FestActivityForm', () => {
  let el

  beforeEach(() => {
    el = document.createElement('fest-activity-form')
    document.body.appendChild(el)
  })

  it('renders name and location inputs', () => {
    expect(el.querySelector('input[name="name"]')).not.toBeNull()
    expect(el.querySelector('input[name="location"]')).not.toBeNull()
  })

  it('calls the use case with name and location on submit', async () => {
    const useCase = makeUseCase({ id: 'a-1', name: { value: 'Quiz' } })
    el.createActivityUseCase = useCase
    el.querySelector('input[name="name"]').value = 'Quiz'
    el.querySelector('input[name="location"]').value = 'Salle B'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({ name: 'Quiz', location: 'Salle B' })
    )
  })

  it('sends null location when field is empty', async () => {
    const useCase = makeUseCase({ id: 'a-1' })
    el.createActivityUseCase = useCase
    el.querySelector('input[name="name"]').value = 'Quiz'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({ name: 'Quiz', location: null })
    )
  })

  it('dispatches activity-created on success', async () => {
    const activity = { id: 'a-1' }
    el.createActivityUseCase = makeUseCase(activity)
    const events = []
    el.addEventListener('activity-created', e => events.push(e.detail))
    el.querySelector('input[name="name"]').value = 'Quiz'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(events[0]).toBe(activity))
  })

  it('resets the form after successful creation', async () => {
    el.createActivityUseCase = makeUseCase({ id: 'a-1' })
    el.querySelector('input[name="name"]').value = 'Quiz'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(el.querySelector('input[name="name"]').value).toBe(''))
  })

  it('dispatches fest-error on failure', async () => {
    el.createActivityUseCase = makeFailingUseCase('invalid name')
    const errors = []
    el.addEventListener('fest-error', e => errors.push(e.detail))
    el.querySelector('input[name="name"]').value = ''
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(errors[0].message).toContain('invalid name'))
  })
})
