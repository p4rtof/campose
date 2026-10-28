import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/errors.js'
import { dayRange, hourOf, toTime } from '../lib/time.js'
import { quote } from './pricing.service.js'
import { busyRanges, isFree } from './availability.service.js'
import type { BookingBody } from '../schemas/booking.schema.js'

const PAYMENT_WINDOW_HOURS = 24

export async function createBooking(input: BookingBody) {
  const q = await quote(input)
  const start = hourOf(input.startTime)

  return prisma.$transaction(
    async (tx) => {
      // Cek slot di dalam transaksi supaya tidak ada double booking.
      const busy = await busyRanges(input.eventDate, tx)
      if (!isFree(start, q.pkg.hours, busy)) {
        throw new AppError(409, 'SLOT_TAKEN', 'Jam yang dipilih sudah dibooking. Pilih jam lain.')
      }
      const override = await tx.availability.findUnique({ where: { date: dayRange(input.eventDate) } })
      if (override?.status === 'PENUH') throw new AppError(409, 'SLOT_TAKEN', 'Tanggal tersebut sudah penuh.')

      const year = new Date().getFullYear()
      const count = await tx.booking.count({ where: { code: { startsWith: `CMP-${year}-` } } })
      const code = `CMP-${year}-${String(count + 1).padStart(4, '0')}`

      return tx.booking.create({
        data: {
          code,
          packageId: q.pkg.id,
          eventDate: dayRange(input.eventDate),
          startTime: input.startTime,
          endTime: toTime(start + q.pkg.hours),
          location: input.location,
          eventType: input.eventType,
          eventName: input.eventName ?? null,
          guestCount: input.guestCount ?? null,
          organization: input.organization ?? null,
          notes: input.notes ?? null,
          customerName: input.customer.name,
          email: input.customer.email,
          whatsapp: input.customer.whatsapp,
          voucherCode: q.voucherCode,
          subtotal: q.subtotal,
          discount: q.discount,
          total: q.total,
          paymentDeadline: new Date(Date.now() + PAYMENT_WINDOW_HOURS * 3600_000),
          addons: { create: q.items.map((i) => ({ addonId: i.addonId, qty: i.qty, price: i.price })) },
        },
        include: { package: true },
      })
    },
    { isolationLevel: 'Serializable' },
  )
}

export async function getBooking(code: string) {
  const b = await prisma.booking.findUnique({
    where: { code },
    include: { package: true, addons: { include: { addon: true } }, payments: true },
  })
  if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking tidak ditemukan')
  return b
}
