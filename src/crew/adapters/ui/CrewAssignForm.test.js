// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './CrewAssignForm.js'

const makeUseCase = (result) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

const volunteers = [
  { id: 'v-1', name: { value: 'Alice' } },
  { id: 'v-2', name: { value: 'Bob' } },
]
const posts = [
  {
    id: 'p-1',
    name: { value: 'Accueil' },
    slots: [{ id: 's-1', window: { day: 'saturday', startTime: '09:00', endTime: '12:00' } }],
  },
  {
    id: 'p-2',
    name: { value: 'Bar' },
    slots: [{ id: 's-2', window: { day: 'saturday', startTime: '14:00', endTime: '17:00' } }],
  },
]

describe('CrewAssignForm', () => {
  let el

  beforeEach(() => {
    el = document.createElement('crew-assign-form')
    document.body.appendChild(el)
    el.volunteers = volunteers
    el.posts = posts
    el.editionId = 'edition-2024'
  })

  it('renders volunteer and post selectors', () => {
    expect(el.querySelector('select[name="volunteerId"]')).not.toBeNull()
    expect(el.querySelector('select[name="postId"]')).not.toBeNull()
    expect(el.querySelector('select[name="slotId"]')).not.toBeNull()
  })

  it('populates volunteers in their selector', () => {
    const options = el.querySelectorAll('select[name="volunteerId"] option')
    expect(options).toHaveLength(2)
    expect(options[0].value).toBe('v-1')
    expect(options[0].textContent).toBe('Alice')
  })

  it('populates slots for the initially selected post', () => {
    const options = el.querySelectorAll('select[name="slotId"] option')
    expect(options).toHaveLength(1)
    expect(options[0].value).toBe('s-1')
  })

  it('updates slot selector when post changes', () => {
    el.querySelector('select[name="postId"]').value = 'p-2'
    el.querySelector('select[name="postId"]').dispatchEvent(new Event('change'))

    const options = el.querySelectorAll('select[name="slotId"] option')
    expect(options).toHaveLength(1)
    expect(options[0].value).toBe('s-2')
  })

  it('calls the use case with volunteerId, slotId and editionId on submit', async () => {
    const useCase = makeUseCase({ id: 'a-1' })
    el.assignVolunteerUseCase = useCase

    el.querySelector('select[name="volunteerId"]').value = 'v-1'
    el.querySelector('select[name="slotId"]').value = 's-1'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({
        volunteerId: 'v-1',
        slotId: 's-1',
        editionId: 'edition-2024',
      })
    )
  })

  it('dispatches volunteer-assigned on success', async () => {
    const assignment = { id: 'a-1' }
    el.assignVolunteerUseCase = makeUseCase(assignment)

    const events = []
    el.addEventListener('volunteer-assigned', e => events.push(e.detail))

    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(events[0]).toBe(assignment))
  })

  it('dispatches crew-error on conflict', async () => {
    el.assignVolunteerUseCase = makeFailingUseCase('already has a slot overlapping')

    const errors = []
    el.addEventListener('crew-error', e => errors.push(e.detail))

    el.querySelector('form').dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(errors[0].message).toContain('overlapping'))
  })

  describe('selectSlot', () => {
    it('sets the post selector to the given postId', () => {
      el.selectSlot({ postId: 'p-2', slotId: 's-2' })
      expect(el.querySelector('select[name="postId"]').value).toBe('p-2')
    })

    it('sets the slot selector to the given slotId', () => {
      el.selectSlot({ postId: 'p-2', slotId: 's-2' })
      expect(el.querySelector('select[name="slotId"]').value).toBe('s-2')
    })
  })
})
