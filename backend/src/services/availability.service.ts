import { prisma } from '../lib/prisma.js'
import { START_HOURS, dayRange, hourOf, toTime } from '../lib/time.js'

type Busy = { start: number; end: number }

// Slot terisi = semua booking aktif yang tidak dibatalkan
export async function busyRanges(date: string, db: Pick<typeof prisma, 'booking'> = prisma): Promise<Busy[]> {
  const targetDate = dayRange(date)
  const rows = await db.booking.findMany({
    where: {
      eventDate: targetDate,
      status: { not: 'DIBATALKAN' },
    },
    include: { package: true },
  })
  return rows.map((b) => {
    const start = hourOf(b.startTime)
    const dur = b.package?.hours || 2
    return { start, end: start + dur }
  })
}

// Cek apakah slot [start, start + hours] bebas dari bentrok dengan interval busy
export const isFree = (start: number, hours: number, busy: Busy[]) =>
  !busy.some((b) => start < b.end && b.start < start + hours)

export async function freeSlots(
  date: string,
  hours: number,
  db: Pick<typeof prisma, 'booking' | 'availability'> = prisma,
) {
  const override = await db.availability.findUnique({ where: { date: dayRange(date) } })
  const busy = await busyRanges(date, db)

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentHour = now.getHours()

  const isPastDate = date < todayStr
  const isToday = date === todayStr

  return START_HOURS.map((h) => {
    const timeStr = toTime(h)

    // 1. Jika tanggal kemarin/lampau -> disable
    if (isPastDate) {
      return { start: timeStr, available: false, reason: 'Tanggal sudah berlalu' }
    }

    // 2. Jika hari ini & jam sudah lewat -> disable
    if (isToday && h <= currentHour) {
      return { start: timeStr, available: false, reason: 'Waktu sudah berlalu' }
    }

    // 3. Jika sesi melebihi batas jam operasional photobooth (max jam 22.00)
    if (h + hours > 22) {
      return { start: timeStr, available: false, reason: 'Melebihi batas jam operasional' }
    }

    // 4. Jika tanggal di-set libur/penuh oleh admin
    if (override?.status === 'PENUH') {
      return { start: timeStr, available: false, reason: 'Jadwal penuh' }
    }

    // 5. Cek apakah ada tabrakan dengan booking yang sudah ada
    // Contoh: jika jam 10.00 ada booking 2 jam (10-12), maka slot 10.00 dan 11.00 auto disabled!
    const free = isFree(h, hours, busy)
    return {
      start: timeStr,
      available: free,
      reason: free ? undefined : 'Sudah dibooking',
    }
  })
}

const MIN_HOURS = 2 // paket terpendek untuk cek ketersediaan umum

export async function monthStatus(month: string) {
  const [y, m] = month.split('-').map(Number)
  const days = new Date(y, m, 0).getDate()
  const first = new Date(Date.UTC(y, m - 1, 1))
  const last = new Date(Date.UTC(y, m - 1, days, 23, 59, 59))

  const [bookings, overrides] = await Promise.all([
    prisma.booking.findMany({
      where: {
        eventDate: { gte: first, lte: last },
        status: { not: 'DIBATALKAN' },
      },
      include: { package: true },
    }),
    prisma.availability.findMany({ where: { date: { gte: first, lte: last } } }),
  ])

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return Array.from({ length: days }, (_, i) => {
    const d = i + 1
    const date = `${month}-${String(d).padStart(2, '0')}`

    // 1. Tanggal kemarin / sudah lewat
    if (date < todayStr) {
      return { date, status: 'LEWAT', busyRanges: [] }
    }

    // 2. Override dari admin
    const override = overrides.find((o) => o.date.toISOString().slice(0, 10) === date)
    if (override) return { date, status: override.status, busyRanges: [] }

    // 3. Hitung dari booking yang ada
    const dayBookings = bookings.filter((b) => b.eventDate.toISOString().slice(0, 10) === date)
    const busy = dayBookings.map((b) => {
      const start = hourOf(b.startTime)
      const dur = b.package?.hours || 2
      return { start, end: start + dur }
    })

    const freeCount = START_HOURS.filter((h) => isFree(h, MIN_HOURS, busy)).length
    const status = freeCount === 0 ? 'PENUH' : busy.length > 0 ? 'DIBOOKING' : 'TERSEDIA'

    return { date, status, busyRanges: busy }
  })
}
