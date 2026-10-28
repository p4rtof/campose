import { prisma } from '../lib/prisma.js'
import { START_HOURS, dayRange, hourOf, toTime } from '../lib/time.js'

type Busy = { start: number; end: number }

// Slot terisi = booking LUNAS (TERKONFIRMASI), atau booking yang masih
// menunggu pembayaran dan belum lewat batas waktu (menahan slot sementara).
export async function busyRanges(date: string, db: Pick<typeof prisma, 'booking'> = prisma): Promise<Busy[]> {
  const rows = await db.booking.findMany({
    where: {
      eventDate: dayRange(date),
      OR: [{ status: 'TERKONFIRMASI' }, { status: 'MENUNGGU_PEMBAYARAN', paymentDeadline: { gt: new Date() } }],
    },
    include: { package: true },
  })
  return rows.map((b) => ({ start: hourOf(b.startTime), end: hourOf(b.startTime) + b.package.hours }))
}

export const isFree = (start: number, hours: number, busy: Busy[]) =>
  !busy.some((b) => start < b.end && b.start < start + hours)

export async function freeSlots(date: string, hours: number, db: Pick<typeof prisma, 'booking' | 'availability'> = prisma) {
  const override = await db.availability.findUnique({ where: { date: dayRange(date) } })
  const busy = await busyRanges(date, db)
  return START_HOURS.map((h) => ({
    start: toTime(h),
    available: override?.status !== 'PENUH' && isFree(h, hours, busy),
  }))
}

const MIN_HOURS = 2 // paket terpendek

export async function monthStatus(month: string) {
  const [y, m] = month.split('-').map(Number)
  const days = new Date(y, m, 0).getDate()
  const first = new Date(Date.UTC(y, m - 1, 1))
  const last = new Date(Date.UTC(y, m - 1, days))
  const [bookings, overrides] = await Promise.all([
    prisma.booking.findMany({
      where: {
        eventDate: { gte: first, lte: last },
        OR: [{ status: 'TERKONFIRMASI' }, { status: 'MENUNGGU_PEMBAYARAN', paymentDeadline: { gt: new Date() } }],
      },
      include: { package: true },
    }),
    prisma.availability.findMany({ where: { date: { gte: first, lte: last } } }),
  ])

  return Array.from({ length: days }, (_, i) => {
    const d = i + 1
    const date = `${month}-${String(d).padStart(2, '0')}`
    const override = overrides.find((o) => o.date.toISOString().slice(0, 10) === date)
    if (override) return { date, status: override.status }
    const busy = bookings
      .filter((b) => b.eventDate.toISOString().slice(0, 10) === date)
      .map((b) => ({ start: hourOf(b.startTime), end: hourOf(b.startTime) + b.package.hours }))
    const free = START_HOURS.filter((h) => isFree(h, MIN_HOURS, busy)).length
    const status = free === 0 ? 'PENUH' : busy.length > 0 ? 'DIBOOKING' : 'TERSEDIA'
    return { date, status }
  })
}
