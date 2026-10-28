import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError, ok } from '../lib/errors.js'
import { wrap } from '../lib/wrap.js'
import { validate } from '../middlewares/validate.js'
import * as S from '../schemas/booking.schema.js'
import { checkVoucher, quote } from '../services/pricing.service.js'
import { freeSlots, monthStatus } from '../services/availability.service.js'
import { createBooking, getBooking } from '../services/booking.service.js'
import { createPayment, getPayment, markPaid, simulationEnabled } from '../services/payment.service.js'
import { handleChat } from '../services/chat.service.js'

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

// ── Jadwal ──
routes.get('/availability', validate(S.monthQuery, 'query'), wrap(async (req, res) => {
  res.json(ok(await monthStatus(String(req.query.month))))
}))
routes.get('/availability/slots', validate(S.slotsQuery, 'query'), wrap(async (req, res) => {
  const { date, packageId } = req.query as unknown as { date: string; packageId: number }
  const pkg = await prisma.package.findUnique({ where: { id: packageId } })
  if (!pkg) throw new AppError(404, 'NOT_FOUND', 'Paket tidak ditemukan')
  res.json(ok({ date, slots: await freeSlots(date, pkg.hours) }))
}))

// ── Voucher & booking ──
routes.post('/vouchers/validate', validate(S.voucherBody), wrap(async (req, res) => {
  const v = await checkVoucher(req.body.code)
  res.json(ok({ code: v.code, discountAmount: v.discountAmount }))
}))
routes.post('/bookings/quote', validate(S.quoteBody), wrap(async (req, res) => {
  const q = await quote(req.body)
  res.json(ok({ package: q.pkg.name, items: q.items, subtotal: q.subtotal, discount: q.discount, total: q.total }))
}))
routes.post('/bookings', validate(S.bookingBody), wrap(async (req, res) => {
  const b = await createBooking(req.body)
  res.status(201).json(ok({
    code: b.code, status: b.status, packageName: b.package.name,
    eventDate: req.body.eventDate, startTime: b.startTime, endTime: b.endTime,
    subtotal: b.subtotal, discount: b.discount, total: b.total, paymentDeadline: b.paymentDeadline,
  }))
}))
routes.get('/bookings/:code', wrap(async (req, res) => {
  res.json(ok(await getBooking(req.params.code)))
}))

// ── Pembayaran (SIMULASI) ──
routes.post('/bookings/:code/payments', validate(S.paymentBody), wrap(async (req, res) => {
  res.status(201).json(ok(await createPayment(req.params.code, req.body.method)))
}))
routes.get('/payments/:id', wrap(async (req, res) => {
  res.json(ok(await getPayment(req.params.id)))
}))
routes.post('/payments/:id/simulate-paid', wrap(async (req, res) => {
  if (!simulationEnabled()) throw new AppError(403, 'FORBIDDEN', 'Simulasi pembayaran dinonaktifkan')
  res.json(ok(await markPaid(req.params.id)))
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
