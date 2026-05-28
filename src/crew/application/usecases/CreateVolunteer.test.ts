import { describe, it, expect, vi } from 'vitest'
import { CreateVolunteer, VolunteerAlreadyExistsError } from './CreateVolunteer'
import { VolunteerCreated } from '../../domain/events'
import { Volunteer } from '../../domain/model/Volunteer'

const mockRepo = {
  findAll: vi.fn(),
  save: vi.fn(),
  findById: vi.fn(),
  delete: vi.fn()
}

describe('CreateVolunteer', () => {
  it('emits VolunteerCreated with correct name', async () => {
    mockRepo.findAll.mockResolvedValue([])
    const useCase = new CreateVolunteer(mockRepo)
    const event = await useCase.execute({ name: 'Alice' })
    expect(event).toBeInstanceOf(VolunteerCreated)
    expect(event.payload.name).toBe('Alice')
  })

  it('throws on empty name', async () => {
    mockRepo.findAll.mockResolvedValue([])
    const useCase = new CreateVolunteer(mockRepo)
    await expect(useCase.execute({ name: '' })).rejects.toThrow()
  })

  it('throws VolunteerAlreadyExistsError when name already exists (case insensitive)', async () => {
    mockRepo.findAll.mockResolvedValue([Volunteer.create('Alice')])
    const useCase = new CreateVolunteer(mockRepo)
    await expect(useCase.execute({ name: 'alice' })).rejects.toThrow(VolunteerAlreadyExistsError)
    await expect(useCase.execute({ name: 'ALICE' })).rejects.toThrow(VolunteerAlreadyExistsError)
  })

  it('allows different names', async () => {
    mockRepo.findAll.mockResolvedValue([Volunteer.create('Alice')])
    const useCase = new CreateVolunteer(mockRepo)
    const event = await useCase.execute({ name: 'Bob' })
    expect(event).toBeInstanceOf(VolunteerCreated)
    expect(event.payload.name).toBe('Bob')
  })
})
