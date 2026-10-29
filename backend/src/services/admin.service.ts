import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/errors.js'
import { signToken } from '../lib/jwt.js'
import bcrypt from 'bcryptjs'
import { sendBookingConfirmedEmail, sendBookingRejectedEmail } from './email.service.js'

export async function adminLogin(email: string, password: string) {
  let admin = await prisma.adminUser.findUnique({ where: { email } })
  
  // Jika database belum di-seed dan tabel AdminUser masih kosong, auto-create admin default
  if (!admin) {
    const totalAdmins = await prisma.adminUser.count()
    if (totalAdmins === 0 && email.trim().toLowerCase() === 'admin@campose.id' && password === 'admin123') {
      const passwordHash = await bcrypt.hash('admin123', 12)
      admin = await prisma.adminUser.create({
        data: {
          name: 'Admin Campose',
          email: 'admin@campose.id',
          passwordHash,
          role: 'OWNER',
        },
      })
    } else {
      throw new AppError(401, 'UNAUTHORIZED', 'Email atau password salah')
    }
  }

  const valid = await bcrypt.compare(password, admin.passwordHash)
  if (!valid) throw new AppError(401, 'UNAUTHORIZED', 'Email atau password salah')

  const token = signToken({ adminId: admin.id, role: admin.role })
  return {
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  }
}

export async function getDashboardStats() {
  const db = prisma as any
  const [totalBookings, pendingProof, confirmed, revenue] = await Promise.all([
    prisma.booking.count(),
    db.payment.count({ where: { status: 'MENUNGGU_KONFIRMASI' } }),
    prisma.booking.count({ where: { status: 'TERKONFIRMASI' } }),
    prisma.payment.aggregate({
      where: { status: 'PAID' as any },
      _sum: { amount: true },
    }),
  ])
  return {
    totalBookings,
    pendingProof,
    confirmed,
    totalRevenue: (revenue as any)._sum.amount ?? 0,
  }
}

export async function listBookings(page = 1, limit = 20, status?: string) {
  const where = status ? { status: status as any } : {}
  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        package: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ])
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getBookingDetail(code: string) {
  const b = await prisma.booking.findUnique({
    where: { code },
    include: {
      package: true,
      addons: { include: { addon: true } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking tidak ditemukan')
  return b
}

export async function confirmPayment(paymentId: string, adminNote?: string, emitEvent?: (event: string, data: any) => void) {
  const db = prisma as any
  const p = await db.payment.findUnique({ where: { id: paymentId } })
  if (!p) throw new AppError(404, 'NOT_FOUND', 'Pembayaran tidak ditemukan')
  if (p.status !== 'MENUNGGU_KONFIRMASI')
    throw new AppError(409, 'CONFLICT', 'Pembayaran tidak dalam status menunggu konfirmasi')

  const result = await prisma.$transaction(async (tx) => {
    const txdb = tx as any
    const paid = await txdb.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paidAt: new Date(), adminNote },
    })
    const booking = await tx.booking.update({
      where: { id: p.bookingId },
      data: { status: 'TERKONFIRMASI' },
      include: {
        package: true,
        addons: { include: { addon: true } },
      },
    })
    if (booking.voucherCode) {
      await tx.voucher.update({
        where: { code: booking.voucherCode },
        data: { used: { increment: 1 } },
      })
    }
    return { paid, booking }
  })

  // Kirim email konfirmasi ke customer secara asynchronous (tanpa memblokir response jika SMTP lambat)
  sendBookingConfirmedEmail({
    code: result.booking.code,
    customerName: result.booking.customerName,
    email: result.booking.email,
    whatsapp: result.booking.whatsapp,
    eventDate: result.booking.eventDate,
    startTime: result.booking.startTime,
    endTime: result.booking.endTime,
    location: result.booking.location,
    eventName: result.booking.eventName,
    eventType: result.booking.eventType,
    total: result.booking.total,
    package: result.booking.package,
    addons: result.booking.addons as any,
    adminNote,
  }).catch((err) => console.error('Gagal mengirim email konfirmasi booking:', err))

  if (emitEvent) {
    emitEvent('payment:confirmed', {
      bookingCode: result.booking.code,
      customerName: result.booking.customerName,
    })
  }

  return result
}

export async function rejectPayment(paymentId: string, adminNote?: string, emitEvent?: (event: string, data: any) => void) {
  const db = prisma as any
  const p = await db.payment.findUnique({ where: { id: paymentId } })
  if (!p) throw new AppError(404, 'NOT_FOUND', 'Pembayaran tidak ditemukan')
  if (p.status !== 'MENUNGGU_KONFIRMASI')
    throw new AppError(409, 'CONFLICT', 'Pembayaran tidak dalam status menunggu konfirmasi')

  const paid = await db.payment.update({
    where: { id: paymentId },
    data: { status: 'DITOLAK', adminNote },
  })

  const booking = await prisma.booking.findUnique({
    where: { id: p.bookingId },
    include: {
      package: true,
      addons: { include: { addon: true } },
    },
  })

  if (booking) {
    // Kirim email penolakan bukti pembayaran ke customer
    sendBookingRejectedEmail({
      code: booking.code,
      customerName: booking.customerName,
      email: booking.email,
      whatsapp: booking.whatsapp,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      location: booking.location,
      eventName: booking.eventName,
      eventType: booking.eventType,
      total: booking.total,
      package: booking.package,
      addons: booking.addons as any,
      adminNote,
    }, adminNote).catch((err) => console.error('Gagal mengirim email penolakan booking:', err))
  }

  if (emitEvent && booking) {
    emitEvent('payment:rejected', {
      bookingCode: booking.code,
      customerName: booking.customerName,
      reason: adminNote,
    })
  }

  return paid
}
