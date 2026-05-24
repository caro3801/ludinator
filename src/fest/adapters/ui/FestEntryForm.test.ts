// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FestEntryForm } from './FestEntryForm'
import './FestEntryForm'
import { Registration } from '../../domain/model/Registration'

const makeUseCase = <T>(result: T) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg: string) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

const registrations: Registration[] = [
  { id: 'r-1', personName: 'Alice' } as Registration,
  { id: 'r-2', personName: 'Bob' } as Registration,
]

describe('FestEntryForm', () => {
  let el: FestEntryForm

  beforeEach(() => {
    el = document.createElement('fest-entry-form') as FestEntryForm
    document.body.appendChild(el)
    el.hidden = true
  })

  it('is hidden by default', () => {
    expect(el.hidden).toBe(true)
  })

  it('renders a personName input', () => {
    expect(el.querySelector<HTMLInputElement>('input[name="personName"]')).not.toBeNull()
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
    expect(el.querySelectorAll<HTMLButtonElement>('button[data-action="cancel-registration"]')).toHaveLength(2)
  })

  it('calls cancelRegistrationUseCase on delete click', async () => {
    const cancelUC = makeUseCase<undefined>(undefined)
    el.cancelRegistrationUseCase = cancelUC
    el.open({ activityId: 'a-1', slotId: 's-1', registrations })
    el.querySelector<HTMLButtonElement>('button[data-action="cancel-registration"]')?.click()
    await vi.waitFor(() =>
      expect(cancelUC.execute).toHaveBeenCalledWith({
        activityId: 'a-1',
        registrationId: registrations[0].id,
      })
    )
  })

  it('calls registerEntryUseCase on form submit', async () => {
    const addUC = makeUseCase<Registration>({ id: 'r-3', personName: 'Charlie' } as Registration)
    el.registerEntryUseCase = addUC
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector<HTMLInputElement>('input[name="personName"]')!.value = 'Charlie'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() =>
      expect(addUC.execute).toHaveBeenCalledWith({
        activityId: 'a-1',
        slotId: 's-1',
        personName: 'Charlie',
      })
    )
  })

  it('clears input after successful add', async () => {
    el.registerEntryUseCase = makeUseCase<Registration>({ id: 'r-3', personName: 'Charlie' } as Registration)
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector<HTMLInputElement>('input[name="personName"]')!.value = 'Charlie'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() =>
      expect(el.querySelector<HTMLInputElement>('input[name="personName"]')?.value).toBe('')
    )
  })

  it('dispatches registration-added on successful add', async () => {
    const newReg = { id: 'r-3', personName: 'Charlie' } as Registration
    el.registerEntryUseCase = makeUseCase<Registration>(newReg)
    const events: Registration[] = []
    el.addEventListener('registration-added', (e: Event) => events.push((e as CustomEvent<Registration>).detail))
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector<HTMLInputElement>('input[name="personName"]')!.value = 'Charlie'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(events[0]).toBe(newReg))
  })

  it('does not add duplicate names', async () => {
    el.registerEntryUseCase = makeUseCase<Registration>({ id: 'r-1', personName: 'Alice' } as Registration)
    el.open({ activityId: 'a-1', slotId: 's-1', registrations })
    el.querySelector<HTMLInputElement>('input[name="personName"]')!.value = 'Alice'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() =>
      expect(el.registerEntryUseCase!.execute).not.toHaveBeenCalled()
    )
  })

  it('shows waitlist indicator when over capacity', () => {
    const withWaitlist: Registration[] = [
      { id: 'r-1', personName: 'Alice' } as Registration,
      { id: 'r-2', personName: 'Bob' } as Registration,
      { id: 'r-3', personName: 'Charlie', waitlisted: true } as Registration,
    ]
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: withWaitlist })
    expect(el.textContent).toContain('liste d\'attente')
  })

  it('dispatches fest-error on add failure', async () => {
    el.registerEntryUseCase = makeFailingUseCase('invalid name')
    const errors: { message: string }[] = []
    el.addEventListener('fest-error', (e: Event) => errors.push((e as CustomEvent<{ message: string }>).detail))
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector<HTMLInputElement>('input[name="personName"]')!.value = ''
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(errors[0].message).toContain('invalid name'))
  })

  it('dispatches registration-cancelled on delete success', async () => {
    const cancelUC = makeUseCase<undefined>(undefined)
    el.cancelRegistrationUseCase = cancelUC
    el.open({ activityId: 'a-1', slotId: 's-1', registrations })
    const events: { registrationId: string }[] = []
    el.addEventListener('registration-cancelled', (e: Event) => events.push((e as CustomEvent<{ registrationId: string }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="cancel-registration"]')?.click()
    await vi.waitFor(() => expect(events[0].registrationId).toBe(registrations[0].id))
  })

  it('dispatches fest-error on delete failure', async () => {
    el.cancelRegistrationUseCase = makeFailingUseCase('not found')
    const errors: { message: string }[] = []
    el.addEventListener('fest-error', (e: Event) => errors.push((e as CustomEvent<{ message: string }>).detail))
    el.open({ activityId: 'a-1', slotId: 's-1', registrations })
    el.querySelector<HTMLButtonElement>('button[data-action="cancel-registration"]')?.click()
    await vi.waitFor(() => expect(errors[0].message).toContain('not found'))
  })

  it('reopens form after delete', async () => {
    el.cancelRegistrationUseCase = makeUseCase<undefined>(undefined)
    el.open({ activityId: 'a-1', slotId: 's-1', registrations })
    el.querySelector<HTMLButtonElement>('button[data-action="cancel-registration"]')?.click()
    await vi.waitFor(() => expect(el.hidden).toBe(false))
  })

  it('updates registration count after add', async () => {
    el.registerEntryUseCase = makeUseCase<Registration>({ id: 'r-3', personName: 'Charlie' } as Registration)
    el.open({ activityId: 'a-1', slotId: 's-1', registrations: [] })
    el.querySelector<HTMLInputElement>('input[name="personName"]')!.value = 'Charlie'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(el.textContent).toContain('1'))
  })
})
