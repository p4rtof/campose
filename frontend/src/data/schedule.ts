export type DStatus = 'tersedia' | 'penuh' | 'dibooking'
export function dateStatus(month: number, day: number): DStatus {
  if (day % 9 === 0) return 'penuh'
  if (month === 7 ? [3, 12, 17, 24, 28].includes(day) : day % 8 === 5) return 'dibooking'
  return 'tersedia'
}
export const SLOTS = ['08.00', '09.00', '10.00', '11.00', '12.00', '13.00', '14.00', '15.00', '16.00', '17.00', '18.00', '19.00']
export const slotOff = (day: number, i: number) => (day * 7 + i * 3) % 5 === 0
