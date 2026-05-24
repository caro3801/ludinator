// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { CrewPostList } from './CrewPostList'
import './CrewPostList'
import type { PostRepository } from '../../ports/PostRepository'

interface PostJSON {
  id: string
  name: { value: string }
  minVolunteers: number
  slots: { id: string, window: { day: string, startTime: string, endTime: string } }[]
}

interface SlotJSON {
  id: string
  window: { day: string, startTime: string, endTime: string }
}

const makeSlot = (day: string, startTime: string, endTime: string): SlotJSON => ({
  id: crypto.randomUUID(),
  window: { day, startTime, endTime },
})

const makePost = (name: string, minVolunteers: number, slots: SlotJSON[] = []): PostJSON => ({
  id: crypto.randomUUID(),
  name: { value: name },
  minVolunteers,
  slots,
})

const repoWith = (posts: PostJSON[]): PostRepository => ({
  findAll: async () => posts,
  save: async () => {},
  findById: async () => null,
  delete: async () => {},
} as unknown as PostRepository)

describe('CrewPostList', () => {
  let el: CrewPostList

  beforeEach(() => {
    el = document.createElement('crew-post-list') as CrewPostList
    document.body.appendChild(el)
  })

  it('renders an empty state when no posts exist', async () => {
    await el.refresh(repoWith([]))
    expect(el.textContent).toContain('Aucun poste')
  })

  it('renders each post with its name and min volunteers', async () => {
    await el.refresh(repoWith([makePost('Accueil', 2)]))
    expect(el.textContent).toContain('Accueil')
    expect(el.textContent).toContain('2')
  })

  it('renders a delete button per post', async () => {
    await el.refresh(repoWith([makePost('Accueil', 2)]))
    expect(el.querySelector<HTMLButtonElement>('button[data-action="delete-post"]')).not.toBeNull()
  })

  it('renders an edit-name button per post', async () => {
    await el.refresh(repoWith([makePost('Accueil', 2)]))
    expect(el.querySelector<HTMLButtonElement>('button[data-action="edit-post-name"]')).not.toBeNull()
  })

  it('dispatches post-delete-requested with postId on delete click', async () => {
    const post = makePost('Accueil', 2)
    await el.refresh(repoWith([post]))

    const events: { postId: string }[] = []
    el.addEventListener('post-delete-requested', (e: Event) => events.push((e as CustomEvent<{ postId: string }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="delete-post"]')?.click()

    expect(events[0].postId).toBe(post.id)
  })

  it('dispatches post-edit-name-requested with postId and current name on edit click', async () => {
    const post = makePost('Accueil', 2)
    await el.refresh(repoWith([post]))

    const events: { postId: string, name: string }[] = []
    el.addEventListener('post-edit-name-requested', (e: Event) => events.push((e as CustomEvent<{ postId: string, name: string }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="edit-post-name"]')?.click()

    expect(events[0].postId).toBe(post.id)
    expect(events[0].name).toBe('Accueil')
  })

  it('renders slots under their post', async () => {
    const slots = [makeSlot('saturday', '09:00', '12:00')]
    await el.refresh(repoWith([makePost('Accueil', 2, slots)]))
    expect(el.textContent).toContain('saturday')
    expect(el.textContent).toContain('09:00')
  })

  it('renders a delete button per slot', async () => {
    const slots = [makeSlot('saturday', '09:00', '12:00')]
    await el.refresh(repoWith([makePost('Accueil', 2, slots)]))
    expect(el.querySelector<HTMLButtonElement>('button[data-action="delete-slot"]')).not.toBeNull()
  })

  it('renders an edit button per slot', async () => {
    const slots = [makeSlot('saturday', '09:00', '12:00')]
    await el.refresh(repoWith([makePost('Accueil', 2, slots)]))
    expect(el.querySelector<HTMLButtonElement>('button[data-action="edit-slot"]')).not.toBeNull()
  })

  it('dispatches slot-delete-requested with postId and slotId on delete click', async () => {
    const slot = makeSlot('saturday', '09:00', '12:00')
    const post = makePost('Accueil', 2, [slot])
    await el.refresh(repoWith([post]))

    const events: { postId: string, slotId: string }[] = []
    el.addEventListener('slot-delete-requested', (e: Event) => events.push((e as CustomEvent<{ postId: string, slotId: string }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="delete-slot"]')?.click()

    expect(events[0].postId).toBe(post.id)
    expect(events[0].slotId).toBe(slot.id)
  })

  it('dispatches slot-edit-requested with slot and postId on edit click', async () => {
    const slot = makeSlot('saturday', '09:00', '12:00')
    const post = makePost('Accueil', 2, [slot])
    await el.refresh(repoWith([post]))

    const events: { postId: string, slot: SlotJSON }[] = []
    el.addEventListener('slot-edit-requested', (e: Event) => events.push((e as CustomEvent<{ postId: string, slot: SlotJSON }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="edit-slot"]')?.click()

    expect(events[0].postId).toBe(post.id)
    expect(events[0].slot.id).toBe(slot.id)
  })

  it('replaces content on subsequent refresh', async () => {
    await el.refresh(repoWith([makePost('Accueil', 2)]))
    await el.refresh(repoWith([makePost('Bar', 1)]))
    expect(el.textContent).not.toContain('Accueil')
    expect(el.textContent).toContain('Bar')
  })
})
