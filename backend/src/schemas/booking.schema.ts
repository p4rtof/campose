import { z } from 'zod'

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD')
const time = z.string().regex(/^\d{2}\.00$/, 'Format jam HH.00')

export const bookingBody = z.object({
  packageId: z.number().int().positive(),
  eventDate: date,
  startTime: time,
  location: z.string().min(2),
  eventType: z.string().min(2),
  eventName: z.string().optional().nullable(),
  guestCount: z.number().int().positive().optional().nullable(),
  organization: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    whatsapp: z.string().regex(/^\+?\d{9,15}$/, 'Nomor WhatsApp tidak valid'),
  }),
  addons: z.array(z.object({ addonId: z.number().int().positive(), qty: z.number().int().min(1).max(50) })).default([]),
  voucherCode: z.string().optional().nullable(),
})
export type BookingBody = z.infer<typeof bookingBody>

export const quoteBody = bookingBody.pick({ packageId: true, addons: true, voucherCode: true })

export const monthQuery = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/, 'Format YYYY-MM') })
export const slotsQuery = z.object({ date, packageId: z.coerce.number().int().positive() })
export const paymentBody = z.object({ method: z.enum(['QRIS', 'VA_BCA', 'VA_BNI', 'VA_BRI', 'VA_MANDIRI']) })
export const voucherBody = z.object({ code: z.string().min(1) })
export const chatBody = z.object({ sessionId: z.string().optional(), message: z.string().min(1).max(500) })
export const leadBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  whatsapp: z.string().regex(/^\+?\d{9,15}$/),
  city: z.string().optional(),
  message: z.string().max(1000).optional(),
})
