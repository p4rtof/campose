import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/errors.js'

type Method = 'QRIS' | 'VA_BCA' | 'VA_BNI' | 'VA_BRI' | 'VA_MANDIRI' | 'TRANSFER_MANUAL'

export async function createOrGetPayment(code: string, method: Method) {
  const db = prisma as any
  const b = await prisma.booking.findUnique({ where: { code } })
  if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking tidak ditemukan')
  if (b.status !== 'MENUNGGU_PEMBAYARAN')
    throw new AppError(409, 'CONFLICT', 'Booking ini tidak dalam status menunggu pembayaran')
  if (b.paymentDeadline < new Date())
    throw new AppError(409, 'EXPIRED', 'Batas waktu pembayaran sudah lewat')

  // Cek apakah sudah ada payment PENDING / MENUNGGU_KONFIRMASI
  const existing = await db.payment.findFirst({
    where: {
      bookingId: b.id,
      status: { in: ['PENDING', 'MENUNGGU_KONFIRMASI'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) return existing

  return db.payment.create({
    data: {
      bookingId: b.id,
      method,
      amount: b.total,
      expiresAt: b.paymentDeadline,
    },
  })
}

export async function uploadPaymentProof(
  paymentId: string,
  proofUrl: string,
  emitEvent?: (event: string, data: any) => void,
) {
  const db = prisma as any
  const p = await db.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { package: true } } },
  })
  if (!p) throw new AppError(404, 'NOT_FOUND', 'Pembayaran tidak ditemukan')
  if (!['PENDING', 'DITOLAK'].includes(p.status))
    throw new AppError(409, 'CONFLICT', 'Tidak bisa upload bukti untuk pembayaran ini')

  const updated = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: 'MENUNGGU_KONFIRMASI',
      paymentProofUrl: proofUrl,
      uploadedAt: new Date(),
    },
    include: { booking: { include: { package: true } } },
  })

  // Notifikasi realtime ke admin
  if (emitEvent) {
    emitEvent('payment:proof_uploaded', {
      paymentId: updated.id,
      bookingCode: updated.booking.code,
      customerName: updated.booking.customerName,
      packageName: updated.booking.package.name,
      amount: updated.booking.total,
      proofUrl,
    })
  }

  return updated
}

export async function getPaymentByCode(code: string) {
  const b = await prisma.booking.findUnique({ where: { code } })
  if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking tidak ditemukan')

  const db = prisma as any
  const payment = await db.payment.findFirst({
    where: { bookingId: b.id },
    orderBy: { createdAt: 'desc' },
  })
  return payment
}

export async function getPaymentById(id: string) {
  const db = prisma as any
  const p = await db.payment.findUnique({ where: { id } })
  if (!p) throw new AppError(404, 'NOT_FOUND', 'Pembayaran tidak ditemukan')
  return p
}

export async function checkBookingPaymentStatus(code: string) {
  const b = await prisma.booking.findUnique({
    where: { code },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      package: true,
    },
  })
  if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking tidak ditemukan')
  const payment = (b as any).payments[0]
  return {
    bookingStatus: b.status,
    paymentStatus: payment?.status ?? null,
    paymentId: payment?.id ?? null,
    proofUrl: payment?.paymentProofUrl ?? null,
    adminNote: payment?.adminNote ?? null,
    booking: {
      code: b.code,
      customerName: b.customerName,
      email: b.email,
      whatsapp: b.whatsapp,
      eventDate: b.eventDate,
      startTime: b.startTime,
      endTime: b.endTime,
      location: b.location,
      eventName: b.eventName,
      eventType: b.eventType,
      total: b.total,
      package: b.package,
    },
  }
}
