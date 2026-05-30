// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CrewEditPostNameForm } from './CrewEditPostNameForm'
import './CrewEditPostNameForm'

interface Post {
  id: string
  name: { value: string }
}

const makeUseCase = <T>(result: T) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg: string) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

describe('CrewEditPostNameForm', () => {
  let el: CrewEditPostNameForm

  beforeEach(() => {
    el = document.createElement('crew-edit-post-name-form') as CrewEditPostNameForm
    document.body.appendChild(el)
  })

  it('is hidden by default', () => {
    expect(el.hidden).toBe(true)
  })

  it('becomes visible and pre-fills name input when opened', () => {
    el.open({ postId: 'p-1', name: 'Accueil' })
    expect(el.hidden).toBe(false)
    expect(el.querySelector<HTMLInputElement>('input[name="name"]')?.value).toBe('Accueil')
  })

  it('calls the use case with postId and new name on submit', async () => {
    const useCase = makeUseCase({ id: 'p-1' })
    el.updatePostNameUseCase = useCase
    el.open({ postId: 'p-1', name: 'Accueil' })

    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Entrée'
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({ postId: 'p-1', name: 'Entrée' })
    )
  })

  it('dispatches post-name-updated and hides itself on success', async () => {
    el.updatePostNameUseCase = makeUseCase({ id: 'p-1', name: { value: 'Entrée' } })
    el.open({ postId: 'p-1', name: 'Accueil' })

    const events: { postId: string; name: string }[] = []
    el.addEventListener('post-name-updated', (e: Event) => events.push((e as CustomEvent<{ postId: string; name: string }>).detail))
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => {
      expect(events[0]).toEqual({ postId: 'p-1', name: 'Accueil' })
      expect(el.hidden).toBe(true)
    })
  })

  it('dispatches crew-error on failure', async () => {
    el.updatePostNameUseCase = makeFailingUseCase('Post name must not be empty')
    el.open({ postId: 'p-1', name: 'Accueil' })

    const errors: { message: string }[] = []
    el.addEventListener('crew-error', (e: Event) => errors.push((e as CustomEvent<{ message: string }>).detail))
    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(errors[0].message).toContain('empty'))
  })

  it('hides itself when cancel is clicked', () => {
    el.open({ postId: 'p-1', name: 'Accueil' })
    el.querySelector<HTMLButtonElement>('button[data-action="cancel"]')?.click()
    expect(el.hidden).toBe(true)
  })
})
