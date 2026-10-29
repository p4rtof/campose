export type DStatus = 'tersedia' | 'penuh' | 'dibooking' | 'lewat'

export const SLOTS = [
  '08.00', '09.00', '10.00', '11.00', '12.00', '13.00',
  '14.00', '15.00', '16.00', '17.00', '18.00', '19.00', '20.00'
]

// Cek apakah suatu tanggal sudah kemarin / lampau
export function isPastDate(year: number, month: number, day: number): boolean {
  const today = new Date()
  const target = new Date(year, month - 1, day, 23, 59, 59)
  return target.getTime() < today.getTime()
}

// Cek apakah tanggal adalah hari ini
export function isTodayDate(year: number, month: number, day: number): boolean {
  const today = new Date()
  return (
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day
  )
}

// Cek apakah jam slot sudah berlalu untuk hari ini
export function isPastSlot(year: number, month: number, day: number, slotStr: string): boolean {
  if (!isTodayDate(year, month, day)) return false
  const now = new Date()
  const slotHour = parseInt(slotStr.replace(':', '.').split('.')[0], 10)
  return slotHour <= now.getHours()
}

// Cek apakah slot jam melebihi batas jam operasional (misal max operasional jam 22.00)
export function isExceedingHours(slotStr: string, packageHours: number): boolean {
  const slotHour = parseInt(slotStr.replace(':', '.').split('.')[0], 10)
  return slotHour + packageHours > 22
}

// Cek bentrok jam: jika jam 10.00 dibooking 2 jam (10-12), maka [slot, slot + packageHours]
// tidak boleh bertabrakan dengan [busy.start, busy.end]
export function isSlotConflicting(
  slotStr: string,
  packageHours: number,
  busyList: { start: number; end: number }[],
): boolean {
  const start = parseInt(slotStr.replace(':', '.').split('.')[0], 10)
  const end = start + packageHours
  return busyList.some((b) => start < b.end && b.start < end)
}

// Default fallback jika offline / belum fetch
export function dateStatus(month: number, day: number, year = new Date().getFullYear()): DStatus {
  if (isPastDate(year, month, day)) return 'lewat'
  return 'tersedia'
}
