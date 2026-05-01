// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageVolunteerRepository } from './LocalStorageVolunteerRepository.js'
import { Volunteer } from '../../domain/model/Volunteer.js'

describe('LocalStorageVolunteerRepository', () => {
  let repo

  beforeEach(() => {
    localStorage.clear()
    repo = new LocalStorageVolunteerRepository()
  })

  it('saves and retrieves a volunteer by id', async () => {
    const volunteer = Volunteer.create('Alice')
    await repo.save(volunteer)

    const found = await repo.findById(volunteer.id)
    expect(found.id).toBe(volunteer.id)
    expect(found.name.value).toBe('Alice')
  })

  it('returns null when volunteer is not found', async () => {
    expect(await repo.findById('unknown')).toBeNull()
  })

  it('returns all saved volunteers', async () => {
    await repo.save(Volunteer.create('Alice'))
    await repo.save(Volunteer.create('Bob'))

    const all = await repo.findAll()
    expect(all).toHaveLength(2)
    expect(all.map(v => v.name.value)).toContain('Alice')
    expect(all.map(v => v.name.value)).toContain('Bob')
  })

  it('overwrites a volunteer on second save (same id)', async () => {
    const volunteer = Volunteer.create('Alice')
    await repo.save(volunteer)
    await repo.save(volunteer)

    expect(await repo.findAll()).toHaveLength(1)
  })

  it('persists across repository instances (same localStorage)', async () => {
    const volunteer = Volunteer.create('Alice')
    await repo.save(volunteer)

    const repo2 = new LocalStorageVolunteerRepository()
    const found = await repo2.findById(volunteer.id)
    expect(found.name.value).toBe('Alice')
  })
})
