// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FestActivityForm } from './FestActivityForm'
import './FestActivityForm'

const makeUseCase = <T>(result: T) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg: string) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

describe('FestActivityForm', () => {
  let el: FestActivityForm

  beforeEach(() => {
    el = document.createElement('fest-activity-form') as FestActivityForm
    document.body.appendChild(el)
  })

  it('renders name and location inputs', () => {
    expect(el.querySelector<HTMLInputElement>('input[name="name"]')).not.toBeNull()
    expect(el.querySelector<HTMLInputElement>('input[name="location"]')).not.toBeNull()
  })

  it('calls the use case with name and location on submit', async () => {
    const useCase = makeUseCase({ id: 'a-1', name: { value: 'Quiz' } })
    el.createActivityUseCase = useCase
    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Quiz'
    el.querySelector<HTMLInputElement>('input[name="location"]')!.value = 'Salle B'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({ name: 'Quiz', location: 'Salle B' })
    )
  })

  it('sends null location when field is empty', async () => {
    const useCase = makeUseCase({ id: 'a-1' })
    el.createActivityUseCase = useCase
    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Quiz'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({ name: 'Quiz', location: null })
    )
  })

  it('dispatches activity-created on success', async () => {
    const activity = { id: 'a-1' }
    el.createActivityUseCase = makeUseCase(activity)
    const events: { id: string }[] = []
    el.addEventListener('activity-created', (e: Event) => events.push((e as CustomEvent<{ id: string }>).detail))
    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Quiz'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(events[0]).toBe(activity))
  })

  it('resets the form after successful creation', async () => {
    el.createActivityUseCase = makeUseCase({ id: 'a-1' })
    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Quiz'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(el.querySelector<HTMLInputElement>('input[name="name"]')?.value).toBe(''))
  })

  it('dispatches fest-error on failure', async () => {
    el.createActivityUseCase = makeFailingUseCase('invalid name')
    const errors: { message: string }[] = []
    el.addEventListener('fest-error', (e: Event) => errors.push((e as CustomEvent<{ message: string }>).detail))
    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = ''
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(errors[0].message).toContain('invalid name'))
  })
})
