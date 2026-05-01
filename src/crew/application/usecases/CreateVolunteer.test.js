import { describe, it, expect, beforeEach } from 'vitest'
import { CreateVolunteer } from './CreateVolunteer.js'
import { InMemoryVolunteerRepository } from '../../adapters/storage/InMemoryVolunteerRepository.js'

describe('CreateVolunteer', () => {
  let repo, useCase

  beforeEach(() => {
    repo = new InMemoryVolunteerRepository()
    useCase = new CreateVolunteer(repo)
  })

  it('creates and persists a volunteer', async () => {
    const volunteer = await useCase.execute({ name: 'Alice' })
    expect(volunteer.name.value).toBe('Alice')
    expect(await repo.findById(volunteer.id)).toBe(volunteer)
  })

  it('rejects an empty name', async () => {
    await expect(useCase.execute({ name: '' })).rejects.toThrow()
  })
})
