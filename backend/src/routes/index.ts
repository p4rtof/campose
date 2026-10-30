import { Router } from 'express'
import path from 'path'
import { prisma } from '../lib/prisma.js'
import { AppError, ok } from '../lib/errors.js'
import { wrap } from '../lib/wrap.js'
import { validate } from '../middlewares/validate.js'
import * as S from '../schemas/booking.schema.js'
import { checkVoucher, quote } from '../services/pricing.service.js'
import { freeSlots, monthStatus } from '../services/availability.service.js'
import { createBooking, getBooking } from '../services/booking.service.js'
import { handleChat } from '../services/chat.service.js'
import { uploadMiddleware } from '../lib/upload.js'
import {
  createOrGetPayment,
  uploadPaymentProof,
  checkBookingPaymentStatus,
  getPaymentById,
} from '../services/payment-manual.service.js'

export const routes = Router()

routes.get('/health', (_req, res) => res.json(ok({ status: 'ok', time: new Date().toISOString() })))

// ── Katalog ──
routes.get('/packages', wrap(async (_req, res) => {
  res.json(ok(await prisma.package.findMany({ where: { isActive: true }, orderBy: { hours: 'asc' } })))
}))
routes.get('/addons', wrap(async (_req, res) => {
  res.json(ok(await prisma.addon.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } })))
}))
routes.get('/reviews', wrap(async (_req, res) => {
  res.json(ok(await prisma.review.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' } })))
}))
routes.get('/terms', wrap(async (_req, res) => {
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
    const parsed = JSON.parse(setting.value)
    res.json(ok(parsed))
  } catch {
    res.json(ok([setting.value]))
  }
}))

// ── Jadwal ──
routes.get('/availability', validate(S.monthQuery, 'query'), wrap(async (req, res) => {
  res.json(ok(await monthStatus(String(req.query.month))))
}))
routes.get('/availability/slots', validate(S.slotsQuery, 'query'), wrap(async (req, res) => {
  const { date, packageId, hours: qHours } = req.query as any
  let hours = 2
  if (qHours) {
    hours = Number(qHours)
  } else if (packageId) {
    const pkg = await prisma.package.findUnique({ where: { id: Number(packageId) } })
    hours = pkg?.hours || 2
  }
  res.json(ok({ date, slots: await freeSlots(date, hours) }))
}))

// ── Voucher & booking ──
routes.post('/vouchers/validate', validate(S.voucherBody), wrap(async (req, res) => {
  const v = await checkVoucher(req.body.code)
  res.json(ok({ code: v.code, discountAmount: v.discountAmount }))
}))
routes.get('/vouchers/:code', wrap(async (req, res) => {
  const v = await checkVoucher(req.params.code)
  res.json(ok({ code: v.code, discount: v.discountAmount }))
}))
routes.post('/bookings/quote', validate(S.quoteBody), wrap(async (req, res) => {
  const q = await quote(req.body)
  res.json(ok({ package: q.pkg.name, items: q.items, subtotal: q.subtotal, discount: q.discount, total: q.total }))
}))
routes.post('/bookings', validate(S.bookingBody), wrap(async (req, res) => {
  const b = await createBooking(req.body)
  const io = (req as any).app.get('io')
  if (io) {
    io.to('admins').emit('booking:created', {
      id: b.id,
      code: b.code,
      customerName: b.customerName,
      packageName: b.package.name,
      total: b.total,
      eventDate: req.body.eventDate,
      startTime: b.startTime,
      endTime: b.endTime,
    })
  }
  res.status(201).json(ok({
    code: b.code, status: b.status, packageName: b.package.name,
    eventDate: req.body.eventDate, startTime: b.startTime, endTime: b.endTime,
    subtotal: b.subtotal, discount: b.discount, total: b.total, paymentDeadline: b.paymentDeadline,
  }))
}))
routes.get('/bookings/:code', wrap(async (req, res) => {
  res.json(ok(await getBooking(req.params.code)))
}))

// ── Pembayaran Manual (tanpa payment gateway) ──
// 1. Buat / ambil payment untuk booking ini
routes.post('/bookings/:code/payments', wrap(async (req, res) => {
  const method = (req.body.method as string) || 'TRANSFER_MANUAL'
  const payment = await createOrGetPayment(req.params.code, method as any)
  res.status(201).json(ok(payment))
}))

// 2. Cek status pembayaran untuk booking tertentu (polling oleh customer)
routes.get('/bookings/:code/payment-status', wrap(async (req, res) => {
  res.json(ok(await checkBookingPaymentStatus(req.params.code)))
}))

// 3. Upload bukti bayar
routes.post('/payments/:id/upload-proof', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) return next(new AppError(400, 'UPLOAD_ERROR', err.message))
    next()
  })
}, wrap(async (req, res) => {
  if (!req.file) throw new AppError(400, 'NO_FILE', 'File bukti pembayaran wajib diunggah')
  const proofUrl = `/uploads/payment-proofs/${req.file.filename}`
  const io = (req as any).app.get('io')
  const emit = io ? (event: string, data: any) => io.to('admins').emit(event, data) : undefined
  const result = await uploadPaymentProof(req.params.id, proofUrl, emit)
  res.json(ok({ paymentId: result.id, status: result.status, proofUrl }))
}))

// 4. Get payment by ID
routes.get('/payments/:id', wrap(async (req, res) => {
  res.json(ok(await getPaymentById(req.params.id)))
}))

// ── Chatbot & lead ──
routes.post('/chat', validate(S.chatBody), wrap(async (req, res) => {
  res.json(ok(await handleChat(req.body.message, req.body.sessionId)))
}))
routes.get('/chat/sessions/:sessionId', wrap(async (req, res) => {
  res.json(ok(await prisma.chatMessage.findMany({ where: { sessionId: req.params.sessionId }, orderBy: { id: 'asc' } })))
}))
routes.post('/partnership-leads', validate(S.leadBody), wrap(async (req, res) => {
  res.status(201).json(ok(await prisma.partnershipLead.create({ data: req.body })))
}))