import { Router } from 'express'
import { wrap } from '../lib/wrap.js'
import { ok } from '../lib/errors.js'
import { adminAuth } from '../middlewares/adminAuth.js'
import {
  adminLogin,
  getDashboardStats,
  listBookings,
  getBookingDetail,
  confirmPayment,
  rejectPayment,
} from '../services/admin.service.js'
import { prisma } from '../lib/prisma.js'

export const adminRoutes = Router()

// ── Auth ──
adminRoutes.post('/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Email dan password diperlukan' } })
  }
  const result = await adminLogin(email, password)
  res.json(ok(result))
}))

// ── Protected routes ──
adminRoutes.use(adminAuth)

// Dashboard stats
adminRoutes.get('/stats', wrap(async (_req, res) => {
  res.json(ok(await getDashboardStats()))
}))

// List semua booking
adminRoutes.get('/bookings', wrap(async (req, res) => {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 100
  const status = req.query.status as string | undefined
  res.json(ok(await listBookings(page, limit, status)))
}))

// Buat booking manual dari admin (contoh dari WA)
adminRoutes.post('/bookings/manual', wrap(async (req, res) => {
  const { name, whatsapp, packageHours, eventDate, startTime, location, eventName, notes } = req.body
  const hours = Number(packageHours) || 4
  const pkg = await prisma.package.findFirst({ where: { hours } }) ?? await prisma.package.findFirst()
  if (!pkg) return res.status(400).json({ success: false, error: { code: 'NO_PACKAGE', message: 'Paket tidak ditemukan' } })

  const startHour = Number(startTime.slice(0, 2)) || 10
  const endHour = startHour + pkg.hours
  const endTime = `${String(endHour).padStart(2, '0')}:00`

  const year = new Date().getFullYear()
  const count = await prisma.booking.count({ where: { code: { startsWith: `CMP-${year}-` } } })
  const code = `CMP-${year}-${String(count + 1).padStart(4, '0')}`

  const booking = await prisma.booking.create({
    data: {
      code,
      packageId: pkg.id,
      eventDate: new Date(`${eventDate}T00:00:00Z`),
      startTime,
      endTime,
      location: location || 'Lokasi Acara',
      eventType: 'Manual / WhatsApp',
      eventName: eventName || 'Event Photobooth',
      notes: notes || 'Booking manual ditambahkan oleh admin',
      customerName: name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@manual.campose.id`,
      whatsapp: whatsapp || '-',
      subtotal: pkg.price,
      total: pkg.price,
      paymentDeadline: new Date(Date.now() + 24 * 3600_000),
      status: 'MENUNGGU_PEMBAYARAN',
    },
    include: { package: true, payments: true },
  })

  // Buat default payment record
  const db = prisma as any
  await db.payment.create({
    data: {
      bookingId: booking.id,
      method: 'TRANSFER_MANUAL',
      amount: booking.total,
      expiresAt: booking.paymentDeadline,
      status: 'PENDING',
    },
  })

  const io = (req as any).app.get('io')
  if (io) {
    io.to('admins').emit('booking:created', {
      id: booking.id,
      code: booking.code,
      customerName: booking.customerName,
      packageName: pkg.name,
      total: booking.total,
      eventDate,
    })
  }

  res.status(201).json(ok(booking))
}))

// Reschedule booking
adminRoutes.patch('/bookings/:code/reschedule', wrap(async (req, res) => {
  const { date, startTime, endTime } = req.body
  const b = await prisma.booking.findUnique({ where: { code: req.params.code } })
  if (!b) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking tidak ditemukan' } })

  const updated = await prisma.booking.update({
    where: { code: req.params.code },
    data: {
      eventDate: date ? new Date(`${date}T00:00:00Z`) : b.eventDate,
      startTime: startTime || b.startTime,
      endTime: endTime || b.endTime,
    },
    include: { package: true, payments: true },
  })

  const io = (req as any).app.get('io')
  if (io) {
    io.to('admins').emit('booking:updated', { code: b.code, eventDate: date, startTime, endTime })
  }

  res.json(ok(updated))
}))

// Batalkan booking
adminRoutes.patch('/bookings/:code/cancel', wrap(async (req, res) => {
  const { reason } = req.body
  const b = await prisma.booking.findUnique({ where: { code: req.params.code } })
  if (!b) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking tidak ditemukan' } })

  const updated = await prisma.booking.update({
    where: { code: req.params.code },
    data: {
      status: 'DIBATALKAN',
      notes: b.notes ? `${b.notes} | Dibatalkan: ${reason || 'Oleh admin'}` : `Dibatalkan: ${reason || 'Oleh admin'}`,
    },
    include: { package: true, payments: true },
  })

  const io = (req as any).app.get('io')
  if (io) {
    io.to('admins').emit('booking:updated', { code: b.code, status: 'DIBATALKAN' })
  }

  res.json(ok(updated))
}))

// Detail booking
adminRoutes.get('/bookings/:code', wrap(async (req, res) => {
  res.json(ok(await getBookingDetail(req.params.code)))
}))

// Update status booking manual
adminRoutes.patch('/bookings/:code/status', wrap(async (req, res) => {
  const { status } = req.body
  const b = await prisma.booking.findUnique({ where: { code: req.params.code } })
  if (!b) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking tidak ditemukan' } })
  const updated = await prisma.booking.update({ where: { code: req.params.code }, data: { status } })
  res.json(ok(updated))
}))

// Konfirmasi pembayaran
adminRoutes.post('/payments/:id/confirm', wrap(async (req, res) => {
  const { adminNote } = req.body
  const io = (req as any).app.get('io')
  const emit = io ? (event: string, data: any) => io.to('admins').emit(event, data) : undefined
  const result = await confirmPayment(req.params.id, adminNote, emit)
  res.json(ok(result))
}))

// Tolak pembayaran
adminRoutes.post('/payments/:id/reject', wrap(async (req, res) => {
  const { adminNote } = req.body
  const io = (req as any).app.get('io')
  const emit = io ? (event: string, data: any) => io.to('admins').emit(event, data) : undefined
  const result = await rejectPayment(req.params.id, adminNote, emit)
  res.json(ok(result))
}))

// List semua payment pending (untuk notifikasi)
adminRoutes.get('/payments/pending', wrap(async (_req, res) => {
  const payments = await prisma.payment.findMany({
    where: { status: 'MENUNGGU_KONFIRMASI' as any },
    include: {
      booking: { include: { package: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(ok(payments))
}))

// List semua payment
adminRoutes.get('/payments', wrap(async (req, res) => {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 20
  const status = req.query.status as string | undefined
  const where = status ? { status: status as any } : {}
  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { booking: { include: { package: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ])
  res.json(ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) }))
}))

// Detail satu payment
adminRoutes.get('/payments/:id', wrap(async (req, res) => {
  const p = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { booking: { include: { package: true } } },
  })
  if (!p) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment tidak ditemukan' } })
  res.json(ok(p))
}))

// Katalog management
adminRoutes.get('/packages', wrap(async (_req, res) => {
  res.json(ok(await prisma.package.findMany({ orderBy: { hours: 'asc' } })))
}))
adminRoutes.patch('/packages/:id', wrap(async (req, res) => {
  const id = Number(req.params.id)
  const data: any = {}
  if (req.body.name !== undefined) data.name = req.body.name
  if (req.body.price !== undefined) data.price = Number(req.body.price)
  if (req.body.hours !== undefined) data.hours = Number(req.body.hours)
  if (req.body.isPopular !== undefined) data.isPopular = Boolean(req.body.isPopular)
  if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive)

  const updated = await prisma.package.update({ where: { id }, data })
  const io = (req as any).app.get('io')
  if (io) {
    io.emit('catalog:updated', { type: 'packages', id })
  }
  res.json(ok(updated))
}))

// Reviews management
adminRoutes.get('/reviews', wrap(async (_req, res) => {
  res.json(ok(await prisma.review.findMany({ orderBy: { createdAt: 'desc' } })))
}))
adminRoutes.patch('/reviews/:id/publish', wrap(async (req, res) => {
  const id = Number(req.params.id)
  const { isPublished } = req.body
  const updated = await prisma.review.update({ where: { id }, data: { isPublished } })
  res.json(ok(updated))
}))

// ── Vouchers Management ──
adminRoutes.get('/vouchers', wrap(async (_req, res) => {
  const list = await prisma.voucher.findMany({ orderBy: { code: 'asc' } })
  res.json(ok(list))
}))

adminRoutes.post('/vouchers', wrap(async (req, res) => {
  const { code, discountAmount, validFrom, validUntil, quota, isActive } = req.body
  const v = await prisma.voucher.create({
    data: {
      code: code.toUpperCase().trim(),
      discountAmount: Number(discountAmount) || 0,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      quota: quota ? Number(quota) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    },
  })
  res.status(201).json(ok(v))
}))

adminRoutes.put('/vouchers/:code', wrap(async (req, res) => {
  const { discountAmount, validFrom, validUntil, quota, isActive } = req.body
  const v = await prisma.voucher.update({
    where: { code: req.params.code },
    data: {
      discountAmount: discountAmount !== undefined ? Number(discountAmount) : undefined,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      quota: quota !== undefined ? Number(quota) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    },
  })
  res.json(ok(v))
}))

adminRoutes.delete('/vouchers/:code', wrap(async (req, res) => {
  await prisma.voucher.delete({ where: { code: req.params.code } })
  res.json(ok({ deleted: true }))
}))

// ── Availability / Calendar ──
adminRoutes.get('/availability', wrap(async (_req, res) => {
  const list = await prisma.availability.findMany({ orderBy: { date: 'asc' } })
  res.json(ok(list))
}))

adminRoutes.post('/availability', wrap(async (req, res) => {
  const { date, status, note } = req.body
  const d = new Date(`${date}T00:00:00Z`)
  const override = await prisma.availability.upsert({
    where: { date: d },
    update: { status: status as any, note },
    create: { date: d, status: status as any, note },
  })
  res.json(ok(override))
}))

// ── Addons Management ──
adminRoutes.get('/addons', wrap(async (_req, res) => {
  res.json(ok(await prisma.addon.findMany({ orderBy: { id: 'asc' } })))
}))

adminRoutes.post('/addons', wrap(async (req, res) => {
  const { name, price, unit, isActive } = req.body
  const created = await prisma.addon.create({
    data: {
      name,
      price: Number(price) || 0,
      unit: unit || null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    },
  })
  const io = (req as any).app.get('io')
  if (io) {
    io.emit('catalog:updated', { type: 'addons' })
  }
  res.status(201).json(ok(created))
}))

adminRoutes.patch('/addons/:id', wrap(async (req, res) => {
  const id = Number(req.params.id)
  const data: any = {}
  if (req.body.name !== undefined) data.name = req.body.name
  if (req.body.price !== undefined) data.price = Number(req.body.price)
  if (req.body.unit !== undefined) data.unit = req.body.unit
  if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive)

  const updated = await prisma.addon.update({ where: { id }, data })
  const io = (req as any).app.get('io')
  if (io) {
    io.emit('catalog:updated', { type: 'addons', id })
  }
  res.json(ok(updated))
}))

adminRoutes.delete('/addons/:id', wrap(async (req, res) => {
  const id = Number(req.params.id)
  await prisma.addon.delete({ where: { id } })
  const io = (req as any).app.get('io')
  if (io) {
    io.emit('catalog:updated', { type: 'addons', id })
  }
  res.json(ok({ deleted: true }))
}))

// ── Terms & Conditions & Settings Management ──
adminRoutes.get('/terms', wrap(async (_req, res) => {
  const setting = await prisma.setting.findUnique({ where: { key: 'terms' } })
  if (!setting?.value) {
    const defaultTerms = [
      'Pemesanan dianggap sah setelah bukti pembayaran DP diverifikasi dan di-ACC oleh admin.',
      'Reschedule maksimal 1x dan diajukan paling lambat H-3 sebelum acara, selebihnya dikenakan biaya.',
      'Waktu layanan dihitung sejak photobooth siap digunakan di lokasi acara.',
      'Keterlambatan akses venue akan mengurangi durasi layanan photobooth.',
      'Pelunasan dilakukan sesuai batas waktu yang tertera pada invoice pembayaran.',
      'Dengan melakukan pemesanan, pemesan dianggap telah menyetujui seluruh syarat dan ketentuan yang berlaku.',
    ]
    return res.json(ok(defaultTerms))
  }
  try {
    res.json(ok(JSON.parse(setting.value)))
  } catch {
    res.json(ok([setting.value]))
  }
}))

adminRoutes.put('/terms', wrap(async (req, res) => {
  const { terms } = req.body
  const val = typeof terms === 'string' ? terms : JSON.stringify(terms || [])
  const saved = await prisma.setting.upsert({
    where: { key: 'terms' },
    update: { value: val },
    create: { key: 'terms', value: val },
  })
  const io = (req as any).app.get('io')
  if (io) {
    io.emit('catalog:updated', { type: 'terms' })
  }
  res.json(ok({ saved: true, updatedAt: saved.updatedAt }))
}))

// ── Admin Users Management ──
adminRoutes.get('/users', wrap(async (_req, res) => {
  const users = await prisma.adminUser.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(ok(users))
}))

adminRoutes.post('/users', wrap(async (req, res) => {
  const { name, email, password, role } = req.body
  const bcrypt = await import('bcryptjs')
  const passwordHash = await bcrypt.default.hash(password || 'admin123', 12)
  const user = await prisma.adminUser.create({
    data: {
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'ADMIN',
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  res.status(201).json(ok(user))
}))
