// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './CrewAddSlotForm.js'

const makeUseCase = (result) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

const posts = [
  { id: 'post-1', name: { value: 'Accueil' } },
  { id: 'post-2', name: { value: 'Bar' } },
]

describe('CrewAddSlotForm', () => {
  let el

  beforeEach(() => {
    el = document.createElement('crew-add-slot-form')
    document.body.appendChild(el)
    el.posts = posts
  })

  it('renders a post selector, day, startTime and endTime inputs', () => {
    expect(el.querySelector('select[name="postId"]')).not.toBeNull()
    expect(el.querySelector('input[name="day"]')).not.toBeNull()
    expect(el.querySelector('input[name="startTime"]')).not.toBeNull()
    expect(el.querySelector('input[name="endTime"]')).not.toBeNull()
  })

  it('populates the post selector with all posts', () => {
    const options = el.querySelectorAll('select[name="postId"] option')
    expect(options).toHaveLength(2)
    expect(options[0].value).toBe('post-1')
    expect(options[0].textContent).toBe('Accueil')
  })

  it('calls the use case with all fields on submit', async () => {
    const useCase = makeUseCase({ id: 'slot-1' })
    el.addSlotToPostUseCase = useCase

    el.querySelector('select[name="postId"]').value = 'post-1'
    el.querySelector('input[name="day"]').value = 'saturday'
    el.querySelector('input[name="startTime"]').value = '09:00'
    el.querySelector('input[name="endTime"]').value = '12:00'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({
        postId: 'post-1',
        day: 'saturday',
        startTime: '09:00',
        endTime: '12:00',
      })
    )
  })

  it('dispatches slot-added on success', async () => {
    const slot = { id: 'slot-1' }
    el.addSlotToPostUseCase = makeUseCase(slot)

    const events = []
    el.addEventListener('slot-added', e => events.push(e.detail))

    el.querySelector('select[name="postId"]').value = 'post-1'
    el.querySelector('input[name="day"]').value = 'saturday'
    el.querySelector('input[name="startTime"]').value = '09:00'
    el.querySelector('input[name="endTime"]').value = '12:00'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(events[0]).toBe(slot))
  })

  it('dispatches crew-error on failure', async () => {
    el.addSlotToPostUseCase = makeFailingUseCase('startTime must be before endTime')

    const errors = []
    el.addEventListener('crew-error', e => errors.push(e.detail))

    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(errors[0].message).toContain('startTime'))
  })
})
