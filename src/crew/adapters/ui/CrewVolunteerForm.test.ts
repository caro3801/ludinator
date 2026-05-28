// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CrewVolunteerForm } from './CrewVolunteerForm'
import './CrewVolunteerForm'

interface Volunteer {
  id: string
  name: { value: string }
}

const makeUseCase = <T>(result: T) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (error: string) => ({ execute: vi.fn().mockRejectedValue(new Error(error)) })

describe('CrewVolunteerForm', () => {
  let el: CrewVolunteerForm

  beforeEach(() => {
    el = document.createElement('crew-volunteer-form') as CrewVolunteerForm
    document.body.appendChild(el)
  })

  it('renders a form with a name input and a submit button', () => {
    expect(el.querySelector<HTMLFormElement>('form')).not.toBeNull()
    expect(el.querySelector<HTMLInputElement>('input[name="name"]')).not.toBeNull()
    expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')).not.toBeNull()
  })

  it('calls the use case with the entered name on submit', async () => {
    const useCase = makeUseCase<Volunteer>({ id: '1', name: { value: 'Alice' } })
    el.createVolunteerUseCase = useCase

    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Alice'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(useCase.execute).toHaveBeenCalledWith({ name: 'Alice' }))
  })

  it('dispatches volunteer-created event on success', async () => {
    const volunteer: Volunteer = { id: '1', name: { value: 'Alice' } }
    el.createVolunteerUseCase = makeUseCase<Volunteer>(volunteer)

    const events: Volunteer[] = []
    el.addEventListener('volunteer-created', (e: Event) => events.push((e as CustomEvent<Volunteer>).detail))

    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Alice'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(events).toHaveLength(1))
    expect(events[0]).toBe(volunteer)
  })

  it('renders a clear button', () => {
    expect(el.querySelector<HTMLButtonElement>('button[type="reset"]')).not.toBeNull()
  })

  it('does not reset the form automatically after successful submission', async () => {
    el.createVolunteerUseCase = makeUseCase<Volunteer>({ id: '1', name: { value: 'Alice' } })
    const input = el.querySelector<HTMLInputElement>('input[name="name"]')
    input!.value = 'Alice'

    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(input!.value).toBe('Alice'))
  })

  it('dispatches crew-error event when use case fails', async () => {
    el.createVolunteerUseCase = makeFailingUseCase('Volunteer name must not be empty')

    const errors: { message: string }[] = []
    el.addEventListener('crew-error', (e: Event) => errors.push((e as CustomEvent<{ message: string }>).detail))

    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = ''
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(errors).toHaveLength(1))
    expect(errors[0].message).toContain('empty')
  })
})
