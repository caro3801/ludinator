// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './FestEntryForm.js'

const makeUseCase = (result) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

const registrations = [
  { id: 'r-1', personName: 'Alice' },
  { id: 'r-2', personName: 'Bob' },
]

describe('FestEntryForm', () => {
  let el

  beforeEach(() => {
    el = document.createElement('fest-entry-form')
    document.body.appendChild(el)
    el.hidden = true
  })

  it('is hidden by default', () => {
    expect(el.hidden).toBe(true)
  })

  it('renders a personName input', () => {
    expect(el.querySelector('input[name="personName"]')).not.toBeNull()
  })

  it('open() shows the form', () => {
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    expect(el.hidden).toBe(false)
  })

  it('displays existing registrations', () => {
    el.open({ activityId: 'a-1', slotId: 's-1', registrations })
    expect(el.textContent).toContain('Alice')
    expect(el.textContent).toContain('Bob')
  })

  it('renders a delete button per registration', () => {
    el.open({ activityId: 'a-1', slotId: 's-1', registrations })
    expect(el.querySelectorAll('button[data-action="cancel-registration"]')).toHaveLength(2)
  })

  it('calls cancelRegistrationUseCase on delete click', async () => {
    const cancelUC = makeUseCase(undefined)
    el.cancelRegistrationUseCase = cancelUC
    el.open({ activityId: 'a-1', slotId: 's-1', registrations })
    el.querySelector('button[data-action="cancel-registration"]').click()
    await vi.waitFor(() =>
      expect(cancelUC.execute).toHaveBeenCalledWith({
        activityId: 'a-1',
        slotId: 's-1',
        registrationId: 'r-1',
      })
    )
  })

  it('removes the person from the displayed list after deletion', async () => {
    el.cancelRegistrationUseCase = makeUseCase(undefined)
    el.open({ activityId: 'a-1', slotId: 's-1', registrations })
    el.querySelector('button[data-action="cancel-registration"]').click()
    await vi.waitFor(() => expect(el.textContent).not.toContain('Alice'))
    expect(el.textContent).toContain('Bob')
  })

  it('dispatches registration-cancelled after deletion', async () => {
    el.cancelRegistrationUseCase = makeUseCase(undefined)
    el.open({ activityId: 'a-1', slotId: 's-1', registrations })
    const events = []
    el.addEventListener('registration-cancelled', e => events.push(e.detail))
    el.querySelector('button[data-action="cancel-registration"]').click()
    await vi.waitFor(() => expect(events).toHaveLength(1))
    expect(events[0].registrationId).toBe('r-1')
  })

  it('calls registerEntryUseCase with activityId, slotId and personName on submit', async () => {
    const useCase = makeUseCase({ id: 'r-3', personName: 'Carol' })
    el.registerEntryUseCase = useCase
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector('input[name="personName"]').value = 'Carol'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({ activityId: 'a-1', slotId: 's-1', personName: 'Carol' })
    )
  })

  it('adds the new person to the displayed list after registration', async () => {
    el.registerEntryUseCase = makeUseCase({ id: 'r-3', personName: 'Carol' })
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector('input[name="personName"]').value = 'Carol'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(el.textContent).toContain('Carol'))
  })

  it('clears the input after successful registration', async () => {
    el.registerEntryUseCase = makeUseCase({ id: 'r-3', personName: 'Carol' })
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector('input[name="personName"]').value = 'Carol'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(el.querySelector('input[name="personName"]').value).toBe(''))
  })

  it('dispatches entry-registered after successful registration', async () => {
    const reg = { id: 'r-3', personName: 'Carol' }
    el.registerEntryUseCase = makeUseCase(reg)
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    const events = []
    el.addEventListener('entry-registered', e => events.push(e.detail))
    el.querySelector('input[name="personName"]').value = 'Carol'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(events[0]).toBe(reg))
  })

  it('does NOT hide after registration (stays open for more entries)', async () => {
    el.registerEntryUseCase = makeUseCase({ id: 'r-3', personName: 'Carol' })
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector('input[name="personName"]').value = 'Carol'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(el.textContent).toContain('Carol'))
    expect(el.hidden).toBe(false)
  })

  it('cancel button hides the form', () => {
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector('button[data-action="cancel"]').click()
    expect(el.hidden).toBe(true)
  })

  it('marks waitlisted registrations visually', () => {
    const withWaitlist = [
      { id: 'r-1', personName: 'Alice', waitlisted: false },
      { id: 'r-2', personName: 'Bob', waitlisted: true },
    ]
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: withWaitlist })
    expect(el.querySelector('[data-waitlisted]')).not.toBeNull()
    expect(el.textContent).toContain('Bob')
  })

  it('marks a newly added waitlisted registration', async () => {
    const reg = { id: 'r-3', personName: 'Carol', waitlisted: true }
    el.registerEntryUseCase = makeUseCase(reg)
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector('input[name="personName"]').value = 'Carol'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(el.querySelector('[data-waitlisted]')).not.toBeNull())
  })

  it('dispatches fest-error on registration failure', async () => {
    el.registerEntryUseCase = makeFailingUseCase('slot not found')
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    const errors = []
    el.addEventListener('fest-error', e => errors.push(e.detail))
    el.querySelector('input[name="personName"]').value = 'Alice'
    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(errors[0].message).toContain('slot not found'))
  })
})
