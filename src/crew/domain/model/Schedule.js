import { Assignment } from './Assignment.js'
import { generateId } from '../../../shared/generateId.js'

export class Schedule {
  #id
  #editionId
  #assignments

  constructor(id, editionId) {
    this.#id = id
    this.#editionId = editionId
    this.#assignments = []
  }

  get id() { return this.#id }
  get editionId() { return this.#editionId }

  assign(volunteer, slot) {
    const assignment = Assignment.create(volunteer.id, slot.id, slot.window)
    this.#assignments.push(assignment)
    return assignment
  }

  getAssignmentsForVolunteer(volunteerId) {
    return this.#assignments.filter(a => a.volunteerId === volunteerId)
  }

  getAssignmentsForSlot(slotId) {
    return this.#assignments.filter(a => a.slotId === slotId)
  }

  removeAssignment(assignmentId) {
    this.#assignments = this.#assignments.filter(a => a.id !== assignmentId)
  }

  removeAssignmentsForSlot(slotId) {
    this.#assignments = this.#assignments.filter(a => a.slotId !== slotId)
  }

  removeAssignmentsForVolunteer(volunteerId) {
    this.#assignments = this.#assignments.filter(a => a.volunteerId !== volunteerId)
  }

  getConflicts() {
    const conflicts = []
    const byVolunteer = {}
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

  toJSON() {
    return { id: this.#id, editionId: this.#editionId, assignments: this.#assignments.map(a => a.toJSON()) }
  }

  static fromJSON({ id, editionId, assignments }) {
    const schedule = new Schedule(id, editionId)
    schedule.#assignments = assignments.map(a => Assignment.fromJSON(a))
    return schedule
  }

  static create(editionId) {
    return new Schedule(generateId(), editionId)
  }
}
