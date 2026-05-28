// ID Types for domain entities - brand nominal typing for type safety

// Crew module
export type PostId = string
export type VolunteerId = string
export type ScheduleId = string
export type CrewSlotId = string
export type EditionId = string
export type SlotId = string

// Fest module
export type ActivityId = string
export type EntryId = string
export type FestSlotId = string
export type RegistrationId = string

// Mioum module
export type ProductId = string
export type TicketId = string
export type TicketLineId = string

// Admin module
export type EventId = string
export type ModuleName = 'crew' | 'fest' | 'mioum'
