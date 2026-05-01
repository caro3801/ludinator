// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './CrewPostForm.js'

const makeUseCase = (result) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

describe('CrewPostForm', () => {
  let el

  beforeEach(() => {
    el = document.createElement('crew-post-form')
    document.body.appendChild(el)
  })

  it('renders inputs for name and minVolunteers', () => {
    expect(el.querySelector('input[name="name"]')).not.toBeNull()
    expect(el.querySelector('input[name="minVolunteers"]')).not.toBeNull()
    expect(el.querySelector('button[type="submit"]')).not.toBeNull()
  })

  it('calls the use case with name and minVolunteers on submit', async () => {
    const useCase = makeUseCase({ id: '1' })
    el.createPostUseCase = useCase

    el.querySelector('input[name="name"]').value = 'Accueil'
    el.querySelector('input[name="minVolunteers"]').value = '2'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(useCase.execute).toHaveBeenCalledWith({ name: 'Accueil', minVolunteers: 2 }))
  })

  it('dispatches post-created on success', async () => {
    const post = { id: '1' }
    el.createPostUseCase = makeUseCase(post)

    const events = []
    el.addEventListener('post-created', e => events.push(e.detail))

    el.querySelector('input[name="name"]').value = 'Accueil'
    el.querySelector('input[name="minVolunteers"]').value = '2'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(events[0]).toBe(post))
  })

  it('dispatches crew-error on failure', async () => {
    el.createPostUseCase = makeFailingUseCase('Post name must not be empty')

    const errors = []
    el.addEventListener('crew-error', e => errors.push(e.detail))

    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(errors[0].message).toContain('empty'))
  })
})
