export const DAY_ORDER: Record<string, number> = {
  // French
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 7,
  // English
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
}

export function compareDays(a: string, b: string): number {
  const orderA = DAY_ORDER[a.toLowerCase()] ?? 0
  const orderB = DAY_ORDER[b.toLowerCase()] ?? 0
  if (orderA !== orderB) return orderA - orderB
  return a.toLowerCase().localeCompare(b.toLowerCase())
}

export function compareSlotsByDay(a: { window: { day: string, startTime: string } }, b: { window: { day: string, startTime: string } }): number {
  const dayCompare = compareDays(a.window.day, b.window.day)
  if (dayCompare !== 0) return dayCompare
  return a.window.startTime.localeCompare(b.window.startTime)
}
