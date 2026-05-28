// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { CrewVolunteerList } from './CrewVolunteerList'
import './CrewVolunteerList'
import type { VolunteerRepository } from '../../ports/VolunteerRepository'

interface VolunteerJSON {
  id: string
  name: { value: string }
}

const makeVolunteer = (name: string): VolunteerJSON => ({ id: crypto.randomUUID(), name: { value: name } })
const repoWith = (volunteers: VolunteerJSON[]): VolunteerRepository => ({
  findAll: async () => volunteers,
  save: async () => {},
  findById: async () => null,
  delete: async () => {},
} as unknown as VolunteerRepository)

describe('CrewVolunteerList', () => {
  let el: CrewVolunteerList

  beforeEach(() => {
    el = document.createElement('crew-volunteer-list') as CrewVolunteerList
    document.body.appendChild(el)
  })

  it('renders an empty state when no volunteers exist', async () => {
    await el.refresh(repoWith([]))
    expect(el.textContent).toContain('Aucun bénévole')
  })

  it('renders a list item for each volunteer', async () => {
    await el.refresh(repoWith([makeVolunteer('Alice'), makeVolunteer('Bob')]))
    expect(el.querySelectorAll<HTMLLIElement>('li')).toHaveLength(2)
    expect(el.textContent).toContain('Alice')
    expect(el.textContent).toContain('Bob')
  })

  it('renders an edit button per volunteer', async () => {
    await el.refresh(repoWith([makeVolunteer('Alice')]))
    expect(el.querySelector<HTMLButtonElement>('button[data-action="edit-volunteer-name"]')).not.toBeNull()
  })

  it('renders a delete button per volunteer', async () => {
    await el.refresh(repoWith([makeVolunteer('Alice')]))
    expect(el.querySelector<HTMLButtonElement>('button[data-action="delete-volunteer"]')).not.toBeNull()
  })

  it('dispatches volunteer-edit-name-requested with volunteerId and name', async () => {
    const volunteer = makeVolunteer('Alice')
    await el.refresh(repoWith([volunteer]))

    const events: { volunteerId: string, name: string }[] = []
    el.addEventListener('volunteer-edit-name-requested', (e: Event) => events.push((e as CustomEvent<{ volunteerId: string, name: string }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="edit-volunteer-name"]')?.click()

    expect(events[0].volunteerId).toBe(volunteer.id)
    expect(events[0].name).toBe('Alice')
  })

  it('dispatches volunteer-delete-requested with volunteerId', async () => {
    const volunteer = makeVolunteer('Alice')
    await el.refresh(repoWith([volunteer]))

    const events: { volunteerId: string }[] = []
    el.addEventListener('volunteer-delete-requested', (e: Event) => events.push((e as CustomEvent<{ volunteerId: string }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="delete-volunteer"]')?.click()

    expect(events[0].volunteerId).toBe(volunteer.id)
  })

  it('replaces the list on subsequent refresh calls', async () => {
    await el.refresh(repoWith([makeVolunteer('Alice')]))
    await el.refresh(repoWith([makeVolunteer('Bob'), makeVolunteer('Carol')]))
    expect(el.querySelectorAll<HTMLLIElement>('li')).toHaveLength(2)
    expect(el.textContent).not.toContain('Alice')
  })
})
