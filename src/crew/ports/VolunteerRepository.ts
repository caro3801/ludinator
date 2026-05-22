import { Volunteer } from '../domain/model/Volunteer'

/**
 * Port interface for volunteer persistence
 */
export interface VolunteerRepository {
  save(volunteer: Volunteer): Promise<void>
  findById(id: string): Promise<Volunteer | null>
  findAll(): Promise<Volunteer[]>
  delete(id: string): Promise<void>
}

/**
 * Abstract base class for volunteer repositories (optional convenience)
 */
export abstract class BaseVolunteerRepository implements VolunteerRepository {
  abstract save(volunteer: Volunteer): Promise<void>
  abstract findById(id: string): Promise<Volunteer | null>
  abstract findAll(): Promise<Volunteer[]>
  abstract delete(id: string): Promise<void>
}
