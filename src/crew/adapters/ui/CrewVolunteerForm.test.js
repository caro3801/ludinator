// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './CrewVolunteerForm.js'

const makeUseCase = (result) => ({
  execute: vi.fn().mockResolvedValue(result),
})

const makeFailingUseCase = (error) => ({
  execute: vi.fn().mockRejectedValue(new Error(error)),
})

describe('CrewVolunteerForm', () => {
  let el

  beforeEach(() => {
    el = document.createElement('crew-volunteer-form')
    document.body.appendChild(el)
  })

  it('renders a form with a name input and a submit button', () => {
    expect(el.querySelector('form')).not.toBeNull()
    expect(el.querySelector('input[name="name"]')).not.toBeNull()
    expect(el.querySelector('button[type="submit"]')).not.toBeNull()
  })

  it('calls the use case with the entered name on submit', async () => {
    const useCase = makeUseCase({ id: '1', name: { value: 'Alice' } })
    el.createVolunteerUseCase = useCase

    el.querySelector('input[name="name"]').value = 'Alice'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(useCase.execute).toHaveBeenCalledWith({ name: 'Alice' }))
  })

  it('dispatches volunteer-created event on success', async () => {
    const volunteer = { id: '1', name: { value: 'Alice' } }
    el.createVolunteerUseCase = makeUseCase(volunteer)

    const events = []
    el.addEventListener('volunteer-created', e => events.push(e.detail))

    el.querySelector('input[name="name"]').value = 'Alice'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(events).toHaveLength(1))
    expect(events[0]).toBe(volunteer)
  })

  it('resets the form after successful submission', async () => {
    el.createVolunteerUseCase = makeUseCase({ id: '1', name: { value: 'Alice' } })
    const input = el.querySelector('input[name="name"]')
    input.value = 'Alice'

    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(input.value).toBe(''))
  })

  it('dispatches crew-error event when use case fails', async () => {
    el.createVolunteerUseCase = makeFailingUseCase('Volunteer name must not be empty')

    const errors = []
    el.addEventListener('crew-error', e => errors.push(e.detail))

    el.querySelector('input[name="name"]').value = ''
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(errors).toHaveLength(1))
    expect(errors[0].message).toContain('empty')
  })
})
