// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CrewPostForm } from './CrewPostForm'
import './CrewPostForm'

interface Post {
  id: string
}

const makeUseCase = <T>(result: T) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg: string) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

describe('CrewPostForm', () => {
  let el: CrewPostForm

  beforeEach(() => {
    el = document.createElement('crew-post-form') as CrewPostForm
    document.body.appendChild(el)
  })

  it('renders inputs for name and minVolunteers', () => {
    expect(el.querySelector<HTMLInputElement>('input[name="name"]')).not.toBeNull()
    expect(el.querySelector<HTMLInputElement>('input[name="minVolunteers"]')).not.toBeNull()
    expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')).not.toBeNull()
  })

  it('calls the use case with name and minVolunteers on submit', async () => {
    const useCase = makeUseCase({ id: '1' })
    el.createPostUseCase = useCase

    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Accueil'
    el.querySelector<HTMLInputElement>('input[name="minVolunteers"]')!.value = '2'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(useCase.execute).toHaveBeenCalledWith({ name: 'Accueil', minVolunteers: 2 }))
  })

  it('dispatches post-created on success', async () => {
    const post: Post = { id: '1' }
    el.createPostUseCase = makeUseCase(post)

    const events: Post[] = []
    el.addEventListener('post-created', (e: Event) => events.push((e as CustomEvent<Post>).detail))

    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Accueil'
    el.querySelector<HTMLInputElement>('input[name="minVolunteers"]')!.value = '2'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(events[0]).toBe(post))
  })

  it('dispatches crew-error on failure', async () => {
    el.createPostUseCase = makeFailingUseCase('Post name must not be empty')

    const errors: { message: string }[] = []
    el.addEventListener('crew-error', (e: Event) => errors.push((e as CustomEvent<{ message: string }>).detail))

    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(errors[0].message).toContain('empty'))
  })
})
