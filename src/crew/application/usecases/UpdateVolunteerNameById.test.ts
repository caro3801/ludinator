import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdateVolunteerNameById } from './UpdateVolunteerNameById'
import { Volunteer } from '../../domain/model/Volunteer'
import { VolunteerAlreadyExistsError } from './CreateVolunteer'
import type { VolunteerRepository } from '../../ports/VolunteerRepository'

describe('UpdateVolunteerNameById', () => {
  it('updates volunteer name when volunteer exists', async () => {
    const volunteer = Volunteer.fromJSON({ id: 'v1', name: 'Alice' })
    const mockRepo: VolunteerRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(volunteer),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const useCase = new UpdateVolunteerNameById(mockRepo)

    const result = await useCase.execute({ volunteerId: 'v1', name: 'Bob' })

    expect(result.type).toBe('VolunteerNameUpdated')
    expect(result.payload.name).toBe('Bob')
    expect(mockRepo.save).toHaveBeenCalledWith(volunteer)
  })

  it('throws when volunteer is not found', async () => {
    const mockRepo: VolunteerRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const useCase = new UpdateVolunteerNameById(mockRepo)

    await expect(useCase.execute({ volunteerId: 'unknown', name: 'Bob' }))
      .rejects.toThrow('Volunteer not found')
  })

  it('saves the updated volunteer', async () => {
    const volunteer = Volunteer.fromJSON({ id: 'v1', name: 'Alice' })
    const mockRepo: VolunteerRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(volunteer),
      findAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const useCase = new UpdateVolunteerNameById(mockRepo)

    await useCase.execute({ volunteerId: 'v1', name: 'Bob' })

    expect(mockRepo.save).toHaveBeenCalledWith(volunteer)
    expect(volunteer.name.value).toBe('Bob')
  })

  it('allows updating volunteer with their own name', async () => {
    const volunteer = Volunteer.fromJSON({ id: 'v1', name: 'Alice' })
    const mockRepo: VolunteerRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(volunteer),
      findAll: vi.fn().mockResolvedValue([volunteer]),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const useCase = new UpdateVolunteerNameById(mockRepo)

    await useCase.execute({ volunteerId: 'v1', name: 'Alice' })

    expect(mockRepo.save).toHaveBeenCalledWith(volunteer)
  })

  it('throws when trying to update with an existing volunteer name (case insensitive)', async () => {
    const volunteer1 = Volunteer.fromJSON({ id: 'v1', name: 'Alice' })
    const volunteer2 = Volunteer.fromJSON({ id: 'v2', name: 'Bob' })
    const mockRepo: VolunteerRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(volunteer1),
      findAll: vi.fn().mockResolvedValue([volunteer1, volunteer2]),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const useCase = new UpdateVolunteerNameById(mockRepo)

    await expect(useCase.execute({ volunteerId: 'v1', name: 'Bob' }))
      .rejects.toThrow(VolunteerAlreadyExistsError)
    await expect(useCase.execute({ volunteerId: 'v1', name: 'bob' }))
      .rejects.toThrow(VolunteerAlreadyExistsError)
  })
})
