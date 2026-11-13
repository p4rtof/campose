import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/errors.js'
import { sendInvoiceEmail } from './email.service.js'

type Method = 'QRIS' | 'VA_BCA' | 'VA_BNI' | 'VA_BRI' | 'VA_MANDIRI' | 'TRANSFER_MANUAL'

// 1. Membuat data pembayaran baru (Status awal: MENUNGGU_VERIFIKASI atau PENDING)
export async function createPayment(code: string, method: Method, paymentProofUrl?: string) {
  const b = await prisma.booking.findUnique({ where: { code } })
  if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking tidak ditemukan')
  if (b.status !== 'MENUNGGU_PEMBAYARAN') throw new AppError(409, 'SLOT_TAKEN', 'Booking ini tidak menunggu pembayaran')
  if (b.paymentDeadline < new Date()) throw new AppError(409, 'SLOT_TAKEN', 'Batas waktu pembayaran sudah lewat')

  // Simpan data pembayaran ke database
  const payment = await prisma.payment.create({
    data: { 
      bookingId: b.id, 
      method, 
      amount: b.total, 
      expiresAt: b.paymentDeadline,
      status: 'PENDING', // Atau status menunggumu
      proofUrl: paymentProofUrl || null
    },
  })

  return payment
}

export async function getPayment(id: string) {
  const p = await prisma.payment.findUnique({ where: { id } })
  if (!p) throw new AppError(404, 'NOT_FOUND', 'Pembayaran tidak ditemukan')
  return p
}

// 2. Mark Paid dipanggil oleh Admin saat memverifikasi bukti bayar manual
export async function markPaid(id: string) {
  const p = await getPayment(id)
  if (p.status === 'PAID') return p
  
  return prisma.$transaction(async (tx) => {
    const paid = await tx.payment.update({ 
      where: { id }, 
      data: { status: 'PAID', paidAt: new Date() } 
    })
    
    const b = await tx.booking.update({ 
      where: { id: p.bookingId }, 
      data: { status: 'TERKONFIRMASI' } 
    })
    
    if (b.voucherCode) {
      await tx.voucher.update({ 
        where: { code: b.voucherCode }, 
        data: { used: { increment: 1 } } 
      })
    }
    
    // Kirim email notifikasi ke pelanggan bahwa pembayaran sudah dikonfirmasi admin
    sendInvoiceEmail(b.email, b.customerName, b.code).catch(console.error);

    return paid
  })
}

export const simulationEnabled = () => process.env.DEMO_MODE !== 'false'