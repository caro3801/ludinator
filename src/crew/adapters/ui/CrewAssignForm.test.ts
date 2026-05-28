// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CrewAssignForm } from './CrewAssignForm'
import './CrewAssignForm'

interface Volunteer {
  id: string
  name: { value: string }
}

interface Post {
  id: string
  name: { value: string }
  slots: { id: string, window: { day: string, startTime: string, endTime: string } }[]
}

const makeUseCase = <T>(result: T) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg: string) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

const volunteers: Volunteer[] = [
  { id: 'v-1', name: { value: 'Alice' } },
  { id: 'v-2', name: { value: 'Bob' } },
]
const posts: Post[] = [
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
  let el: CrewAssignForm

  beforeEach(() => {
    el = document.createElement('crew-assign-form') as CrewAssignForm
    document.body.appendChild(el)
    el.volunteers = volunteers
    el.posts = posts
    el.editionId = 'edition-2024'
  })

  it('renders volunteer and post selectors', () => {
    expect(el.querySelector<HTMLSelectElement>('select[name="volunteerId"]')).not.toBeNull()
    expect(el.querySelector<HTMLSelectElement>('select[name="postId"]')).not.toBeNull()
    expect(el.querySelector<HTMLSelectElement>('select[name="slotId"]')).not.toBeNull()
    expect(el.querySelector<HTMLButtonElement>('button[type="reset"]')).not.toBeNull()
  })

  it('does not reset the form automatically after successful submission', async () => {
    const useCase = makeUseCase({ id: 'a-1' })
    el.assignVolunteerUseCase = useCase

    const volunteerSelect = el.querySelector<HTMLSelectElement>('select[name="volunteerId"]')
    const postSelect = el.querySelector<HTMLSelectElement>('select[name="postId"]')
    const slotSelect = el.querySelector<HTMLSelectElement>('select[name="slotId"]')
    
    volunteerSelect!.value = 'v-1'
    postSelect!.value = 'p-1'
    slotSelect!.value = 's-1'

    el.querySelector('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => {
      expect(volunteerSelect!.value).toBe('v-1')
      expect(postSelect!.value).toBe('p-1')
      expect(slotSelect!.value).toBe('s-1')
    })
  })

  it('populates volunteers in their selector', () => {
    const options = el.querySelectorAll<HTMLOptionElement>('select[name="volunteerId"] option')
    expect(options).toHaveLength(2)
    expect(options[0]?.value).toBe('v-1')
    expect(options[0]?.textContent).toBe('Alice')
  })

  it('populates slots for the initially selected post', () => {
    const options = el.querySelectorAll<HTMLOptionElement>('select[name="slotId"] option')
    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe('s-1')
  })

  it('updates slot selector when post changes', () => {
    const postSelect = el.querySelector<HTMLSelectElement>('select[name="postId"]')
    postSelect!.value = 'p-2'
    postSelect?.dispatchEvent(new Event('change'))

    const options = el.querySelectorAll<HTMLOptionElement>('select[name="slotId"] option')
    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe('s-2')
  })

  it('calls the use case with volunteerId, slotId and editionId on submit', async () => {
    const useCase = makeUseCase({ id: 'a-1' })
    el.assignVolunteerUseCase = useCase

    const volunteerSelect = el.querySelector<HTMLSelectElement>('select[name="volunteerId"]')
    const slotSelect = el.querySelector<HTMLSelectElement>('select[name="slotId"]')
    const form = el.querySelector<HTMLFormElement>('form')
    volunteerSelect!.value = 'v-1'
    slotSelect!.value = 's-1'
    form?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() =>
      expect(useCase.execute).toHaveBeenCalledWith({
        volunteerId: 'v-1',
        slotId: 's-1',
        editionId: 'edition-2024',
      })
    )
  })

  it('dispatches volunteer-assigned on success', async () => {
    el.assignVolunteerUseCase = makeUseCase({ id: 'a-1' })

    const events: unknown[] = []
    el.addEventListener('volunteer-assigned', (e: Event) => events.push((e as CustomEvent).detail))

    const volunteerSelect = el.querySelector<HTMLSelectElement>('select[name="volunteerId"]')
    const slotSelect = el.querySelector<HTMLSelectElement>('select[name="slotId"]')
    volunteerSelect!.value = 'v-1'
    slotSelect!.value = 's-1'

    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(events[0]).toEqual({ volunteerId: 'v-1', slotId: 's-1' }))
  })

  it('dispatches crew-error on conflict', async () => {
    el.assignVolunteerUseCase = makeFailingUseCase('already has a slot overlapping')

    const errors: { message: string }[] = []
    el.addEventListener('crew-error', (e: Event) => errors.push((e as CustomEvent<{ message: string }>).detail))

    el.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(errors[0].message).toContain('overlapping'))
  })

  describe('selectSlot', () => {
    it('sets the post selector to the given postId', () => {
      el.selectSlot({ postId: 'p-2', slotId: 's-2' })
      expect(el.querySelector<HTMLSelectElement>('select[name="postId"]')?.value).toBe('p-2')
    })

    it('sets the slot selector to the given slotId', () => {
      el.selectSlot({ postId: 'p-2', slotId: 's-2' })
      expect(el.querySelector<HTMLSelectElement>('select[name="slotId"]')?.value).toBe('s-2')
    })
  })
})
