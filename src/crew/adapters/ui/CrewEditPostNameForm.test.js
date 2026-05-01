// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './CrewEditPostNameForm.js'

const makeUseCase = (result) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

describe('CrewEditPostNameForm', () => {
  let el

  beforeEach(() => {
    el = document.createElement('crew-edit-post-name-form')
    document.body.appendChild(el)
  })

  it('is hidden by default', () => {
    expect(el.hidden).toBe(true)
  })

  it('becomes visible and pre-fills name input when opened', () => {
    el.open({ postId: 'p-1', name: 'Accueil' })
    expect(el.hidden).toBe(false)
    expect(el.querySelector('input[name="name"]').value).toBe('Accueil')
  })

  it('calls the use case with postId and new name on submit', async () => {
    const useCase = makeUseCase({ id: 'p-1' })
    el.updatePostNameUseCase = useCase
    el.open({ postId: 'p-1', name: 'Accueil' })

    el.querySelector('input[name="name"]').value = 'Entrée'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({ postId: 'p-1', name: 'Entrée' })
    )
  })

  it('dispatches post-name-updated and hides itself on success', async () => {
    const post = { id: 'p-1', name: { value: 'Entrée' } }
    el.updatePostNameUseCase = makeUseCase(post)
    el.open({ postId: 'p-1', name: 'Accueil' })

    const events = []
    el.addEventListener('post-name-updated', e => events.push(e.detail))
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => {
      expect(events[0]).toBe(post)
      expect(el.hidden).toBe(true)
    })
  })

  it('dispatches crew-error on failure', async () => {
    el.updatePostNameUseCase = makeFailingUseCase('Post name must not be empty')
    el.open({ postId: 'p-1', name: 'Accueil' })

    const errors = []
    el.addEventListener('crew-error', e => errors.push(e.detail))
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(errors[0].message).toContain('empty'))
  })

  it('hides itself when cancel is clicked', () => {
    el.open({ postId: 'p-1', name: 'Accueil' })
    el.querySelector('button[data-action="cancel"]').click()
    expect(el.hidden).toBe(true)
  })
})
