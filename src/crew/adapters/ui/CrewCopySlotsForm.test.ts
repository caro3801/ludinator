// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { CrewCopySlotsForm } from './CrewCopySlotsForm'
import './CrewCopySlotsForm'

interface Post {
  id: string
  name: { value: string }
}

describe('CrewCopySlotsForm', () => {
  let el: CrewCopySlotsForm

  beforeEach(() => {
    el = document.createElement('crew-copy-slots-form') as CrewCopySlotsForm
    document.body.appendChild(el)
  })

  it('is hidden by default', () => {
    expect(el.hidden).toBe(true)
  })

  it('renders a form with select and buttons', () => {
    expect(el.querySelector('form')).not.toBeNull()
    expect(el.querySelector('select[name="targetPostId"]')).not.toBeNull()
    expect(el.querySelector('button[type="submit"]')).not.toBeNull()
    expect(el.querySelector('button[data-action="cancel"]')).not.toBeNull()
  })

  it('opens and populates select with posts excluding source', async () => {
    const posts = [
      { id: 'post-1', name: { value: 'Accueil' } },
      { id: 'post-2', name: { value: 'Bar' } },
      { id: 'post-3', name: { value: 'Cuisine' } },
    ]
    el.posts = posts
    
    el.open({ sourcePostId: 'post-1' })
    
    expect(el.hidden).toBe(false)
    
    const select = el.querySelector<HTMLSelectElement>('select[name="targetPostId"]')
    expect(select).not.toBeNull()
    expect(select?.options.length).toBe(3) // empty + 2 others
    expect(select?.querySelector('option[value="post-2"]')?.textContent).toBe('Bar')
    expect(select?.querySelector('option[value="post-3"]')?.textContent).toBe('Cuisine')
    expect(select?.querySelector('option[value="post-1"]')).toBeNull() // source excluded
  })

  it('dispatches slots-copied with sourcePostId and targetPostId on submit', async () => {
    const useCase = { execute: async ({ sourcePostId, targetPostId }: { sourcePostId: string; targetPostId: string }) => ({ 
      payload: { sourcePost: { id: sourcePostId }, targetPost: { id: targetPostId }, copiedSlotCount: 1 } 
    }) }
    el.copySlotsToPostUseCase = useCase as any
    
    const posts = [
      { id: 'post-1', name: { value: 'Accueil' } },
      { id: 'post-2', name: { value: 'Bar' } },
    ]
    el.posts = posts
    el.open({ sourcePostId: 'post-1' })
    
    const events: { sourcePostId: string, targetPostId: string }[] = []
    el.addEventListener('slots-copied', (e: Event) => {
      events.push((e as CustomEvent<{ sourcePostId: string, targetPostId: string }>).detail)
    })
    
    const select = el.querySelector<HTMLSelectElement>('select[name="targetPostId"]')
    select!.value = 'post-2'
    
    const form = el.querySelector<HTMLFormElement>('form')
    form?.dispatchEvent(new Event('submit'))
    
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(events).toHaveLength(1)
    expect(events[0].sourcePostId).toBe('post-1')
    expect(events[0].targetPostId).toBe('post-2')
  })

  it('closes on cancel button click', async () => {
    const posts = [
      { id: 'post-1', name: { value: 'Accueil' } },
      { id: 'post-2', name: { value: 'Bar' } },
    ]
    el.posts = posts
    el.open({ sourcePostId: 'post-1' })
    expect(el.hidden).toBe(false)
    
    el.querySelector<HTMLButtonElement>('button[data-action="cancel"]')?.click()
    expect(el.hidden).toBe(true)
  })

  it('dispatches crew-error on useCase failure', async () => {
    const useCase = { execute: async () => { throw new Error('Copy failed') } }
    el.copySlotsToPostUseCase = useCase as any
    
    const posts = [
      { id: 'post-1', name: { value: 'Accueil' } },
      { id: 'post-2', name: { value: 'Bar' } },
    ]
    el.posts = posts
    el.open({ sourcePostId: 'post-1' })
    
    const errors: { message: string }[] = []
    el.addEventListener('crew-error', (e: Event) => {
      errors.push((e as CustomEvent<{ message: string }>).detail)
    })
    
    const select = el.querySelector<HTMLSelectElement>('select[name="targetPostId"]')
    select!.value = 'post-2'
    
    const form = el.querySelector<HTMLFormElement>('form')
    form?.dispatchEvent(new Event('submit'))
    
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toBe('Copy failed')
  })
})
