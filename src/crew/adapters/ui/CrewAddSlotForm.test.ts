// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './CrewAddSlotForm'

interface UseCase<T, R> {
  execute(params: T): Promise<R>
}

interface Post {
  id: string
  name: { value: string }
}

const makeUseCase = <T, R>(result: R): UseCase<T, R> => ({ execute: vi.fn().mockResolvedValue(result) } as UseCase<T, R>)
const makeFailingUseCase = (msg: string): UseCase<unknown, never> => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) } as UseCase<unknown, never>)

const posts: Post[] = [
  { id: 'post-1', name: { value: 'Accueil' } },
  { id: 'post-2', name: { value: 'Bar' } },
]

interface CrewAddSlotForm extends HTMLElement {
  posts: Post[]
  addSlotToPostUseCase: UseCase<{ postId: string, day: string, startTime: string, endTime: string }, { id: string }>
}

describe('CrewAddSlotForm', () => {
  let el: CrewAddSlotForm

  beforeEach(() => {
    el = document.createElement('crew-add-slot-form') as CrewAddSlotForm
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
    interface Slot { id: string }
    const useCase = makeUseCase<{ postId: string, day: string, startTime: string, endTime: string }, Slot>({ id: 'slot-1' })
    el.addSlotToPostUseCase = useCase

    const postSelect = el.querySelector('select[name="postId"]') as HTMLSelectElement
    const dayInput = el.querySelector('input[name="day"]') as HTMLInputElement
    const startTimeInput = el.querySelector('input[name="startTime"]') as HTMLInputElement
    const endTimeInput = el.querySelector('input[name="endTime"]') as HTMLInputElement
    
    postSelect.value = 'post-1'
    dayInput.value = 'saturday'
    startTimeInput.value = '09:00'
    endTimeInput.value = '12:00'
    el.querySelector('form')?.dispatchEvent(new Event('submit'))

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
    interface Slot { id: string }
    const slot: Slot = { id: 'slot-1' }
    const useCase = makeUseCase<{ postId: string, day: string, startTime: string, endTime: string }, Slot>(slot)
    el.addSlotToPostUseCase = useCase

    const events: Slot[] = []
    el.addEventListener('slot-added', ((e: Event) => {
      const customEvent = e as CustomEvent<Slot>
      events.push(customEvent.detail)
    }) as EventListener)

    const postSelect = el.querySelector('select[name="postId"]') as HTMLSelectElement
    const dayInput = el.querySelector('input[name="day"]') as HTMLInputElement
    const startTimeInput = el.querySelector('input[name="startTime"]') as HTMLInputElement
    const endTimeInput = el.querySelector('input[name="endTime"]') as HTMLInputElement
    
    postSelect.value = 'post-1'
    dayInput.value = 'saturday'
    startTimeInput.value = '09:00'
    endTimeInput.value = '12:00'
    el.querySelector('form')?.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(events[0]).toBe(slot))
  })

  it('dispatches crew-error on failure', async () => {
    el.addSlotToPostUseCase = makeFailingUseCase('startTime must be before endTime')

    interface ErrorDetail { message: string }
    const errors: ErrorDetail[] = []
    el.addEventListener('crew-error', ((e: Event) => {
      const customEvent = e as CustomEvent<ErrorDetail>
      errors.push(customEvent.detail)
    }) as EventListener)

    el.querySelector('form')?.dispatchEvent(new Event('submit'))
    await vi.waitFor(() => expect(errors[0].message).toContain('startTime'))
  })
})
