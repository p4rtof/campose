// MODE SIMULASI. Saat pindah ke payment gateway (Midtrans/Xendit),
// cukup ganti isi createPayment() dan markPaid() di file ini.
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/errors.js'

type Method = 'QRIS' | 'VA_BCA' | 'VA_BNI' | 'VA_BRI' | 'VA_MANDIRI'

export async function createPayment(code: string, method: Method) {
  const b = await prisma.booking.findUnique({ where: { code } })
  if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking tidak ditemukan')
  if (b.status !== 'MENUNGGU_PEMBAYARAN') throw new AppError(409, 'SLOT_TAKEN', 'Booking ini tidak menunggu pembayaran')
  if (b.paymentDeadline < new Date()) throw new AppError(409, 'SLOT_TAKEN', 'Batas waktu pembayaran sudah lewat')
  return prisma.payment.create({
    data: { bookingId: b.id, method, amount: b.total, expiresAt: b.paymentDeadline },
  })
}

export async function getPayment(id: string) {
  const p = await prisma.payment.findUnique({ where: { id } })
  if (!p) throw new AppError(404, 'NOT_FOUND', 'Pembayaran tidak ditemukan')
  return p
}

export async function markPaid(id: string) {
  const p = await getPayment(id)
  if (p.status === 'PAID') return p
  return prisma.$transaction(async (tx) => {
    const paid = await tx.payment.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } })
    const b = await tx.booking.update({ where: { id: p.bookingId }, data: { status: 'TERKONFIRMASI' } })
    if (b.voucherCode) await tx.voucher.update({ where: { code: b.voucherCode }, data: { used: { increment: 1 } } })
    return paid
  })
}

export const simulationEnabled = () => process.env.DEMO_MODE !== 'false'
