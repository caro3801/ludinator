import { Assignment } from './Assignment'
import { TimeWindow } from './TimeWindow'
import { generateId } from '../../../shared/generateId'
import { EditionId, ScheduleId } from '../../../shared/types'

export class Schedule {
  #id: ScheduleId
  #editionId: EditionId
  #assignments: Assignment[]

  constructor(id: ScheduleId, editionId: EditionId) {
    this.#id = id
    this.#editionId = editionId
    this.#assignments = []
  }

  get id(): ScheduleId { return this.#id }
  get editionId(): EditionId { return this.#editionId }

  assign(volunteer: { id: string }, slot: { id: string, window: TimeWindow }): Assignment {
    const assignment = Assignment.create(volunteer.id, slot.id, slot.window)
    this.#assignments.push(assignment)
    return assignment
  }

  getAssignmentsForVolunteer(volunteerId: string): Assignment[] {
    return this.#assignments.filter(a => a.volunteerId === volunteerId)
  }

  getAssignmentsForSlot(slotId: string): Assignment[] {
    return this.#assignments.filter(a => a.slotId === slotId)
  }

  removeAssignment(assignmentId: string): void {
    this.#assignments = this.#assignments.filter(a => a.id !== assignmentId)
  }

  removeAssignmentsForSlot(slotId: string): void {
    this.#assignments = this.#assignments.filter(a => a.slotId !== slotId)
  }

  removeAssignmentsForVolunteer(volunteerId: string): void {
    this.#assignments = this.#assignments.filter(a => a.volunteerId !== volunteerId)
  }

  getConflicts(): { volunteerId: string, slotIdA: string, slotIdB: string }[] {
    const conflicts: { volunteerId: string, slotIdA: string, slotIdB: string }[] = []
    const byVolunteer: Record<string, Assignment[]> = {}
    for (const a of this.#assignments) {
      byVolunteer[a.volunteerId] ??= []
      byVolunteer[a.volunteerId].push(a)
    }
    for (const assignments of Object.values(byVolunteer)) {
      for (let i = 0; i < assignments.length; i++) {
        for (let j = i + 1; j < assignments.length; j++) {
          if (assignments[i].window.overlaps(assignments[j].window)) {
            conflicts.push({
              volunteerId: assignments[i].volunteerId,
              slotIdA: assignments[i].slotId,
              slotIdB: assignments[j].slotId,
            })
          }
        }
      }
    }
    return conflicts
  }

  toJSON(): { id: ScheduleId, editionId: EditionId, assignments: unknown[] } {
    return { id: this.#id, editionId: this.#editionId, assignments: this.#assignments.map(a => a.toJSON()) }
  }

  static fromJSON(data: { id: ScheduleId, editionId: EditionId, assignments: unknown[] }): Schedule {
    const schedule = new Schedule(data.id, data.editionId)
    schedule.#assignments = data.assignments.map((a: unknown) => Assignment.fromJSON(a as any))
    return schedule
  }

  static create(editionId: EditionId): Schedule {
    return new Schedule(generateId() as ScheduleId, editionId)
  }
}
