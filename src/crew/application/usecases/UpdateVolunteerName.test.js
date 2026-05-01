import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateVolunteerName } from './UpdateVolunteerName.js'
import { InMemoryVolunteerRepository } from '../../adapters/storage/InMemoryVolunteerRepository.js'
import { Volunteer } from '../../domain/model/Volunteer.js'

describe('UpdateVolunteerName', () => {
  let repo, useCase, volunteer

  beforeEach(async () => {
    repo = new InMemoryVolunteerRepository()
    useCase = new UpdateVolunteerName(repo)
    volunteer = Volunteer.create('Alice')
    await repo.save(volunteer)
  })

  it('updates the volunteer name and persists it', async () => {
    const updated = await useCase.execute({ volunteerId: volunteer.id, name: 'Alicia' })
    expect(updated.name.value).toBe('Alicia')
    expect((await repo.findById(volunteer.id)).name.value).toBe('Alicia')
  })

  it('throws when volunteer is not found', async () => {
    await expect(useCase.execute({ volunteerId: 'unknown', name: 'Alicia' })).rejects.toThrow()
  })

  it('rejects an empty name', async () => {
    await expect(useCase.execute({ volunteerId: volunteer.id, name: '' })).rejects.toThrow()
  })
})
