import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/errors.js'
import midtransClient from 'midtrans-client'
import { sendInvoiceEmail } from './email.service.js'

type Method = 'QRIS' | 'VA_BCA' | 'VA_BNI' | 'VA_BRI' | 'VA_MANDIRI'

// Setup Konfigurasi Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

export async function createPayment(code: string, method: Method) {
  const b = await prisma.booking.findUnique({ where: { code } })
  if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking tidak ditemukan')
  if (b.status !== 'MENUNGGU_PEMBAYARAN') throw new AppError(409, 'SLOT_TAKEN', 'Booking ini tidak menunggu pembayaran')
  if (b.paymentDeadline < new Date()) throw new AppError(409, 'SLOT_TAKEN', 'Batas waktu pembayaran sudah lewat')

  // 1. Simpan data pembayaran ke database kita (status masih PENDING)
  const payment = await prisma.payment.create({
    data: { bookingId: b.id, method, amount: b.total, expiresAt: b.paymentDeadline },
  })

  // 2. Siapkan parameter untuk dikirim ke Midtrans
  const parameters = {
    transaction_details: {
      order_id: payment.id, // Gunakan ID payment dari DB kita sebagai identifier utama
      gross_amount: b.total,
    },
    customer_details: {
      first_name: b.customerName,
      email: b.email,
      phone: b.whatsapp,
    },
  };

  // 3. Minta token pembayaran (Snap Token) ke Midtrans
  const transaction = await snap.createTransaction(parameters);

  // 4. Kembalikan data payment beserta token Midtrans ke frontend
  return {
    ...payment,
    snapToken: transaction.token,
    redirectUrl: transaction.redirect_url
  }
}

export async function getPayment(id: string) {
  const p = await prisma.payment.findUnique({ where: { id } })
  if (!p) throw new AppError(404, 'NOT_FOUND', 'Pembayaran tidak ditemukan')
  return p
}

// markPaid sekarang hanya dipanggil secara internal saat Midtrans mengirim konfirmasi sukses
export async function markPaid(id: string) {
  const p = await getPayment(id)
  if (p.status === 'PAID') return p
  
  return prisma.$transaction(async (tx) => {
    const paid = await tx.payment.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } })
    const b = await tx.booking.update({ where: { id: p.bookingId }, data: { status: 'TERKONFIRMASI' } })
    if (b.voucherCode) await tx.voucher.update({ where: { code: b.voucherCode }, data: { used: { increment: 1 } } })
    
    // Kirim email otomatis jalan di background
    sendInvoiceEmail(b.email, b.customerName, b.code).catch(console.error);

    return paid
  })
}

// Fungsi baru untuk menangani Webhook dari Midtrans
export async function handleMidtransNotification(notificationJson: any) {
  try {
    const statusResponse = await snap.transaction.notification(notificationJson);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        try {
          await markPaid(orderId);
        } catch (e) {
          console.log('Info: Order ID tes dari Midtrans tidak ada di DB:', orderId);
        }
      }
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      try {
        await prisma.payment.update({ where: { id: orderId }, data: { status: 'FAILED' } });
      } catch (e) {
        console.log('Info: Order ID tes dari Midtrans tidak ada di DB:', orderId);
      }
    }

    return { status: 'OK' };
  } catch (error) {
    console.error('Midtrans Notification Error:', error);
    // Tetap kembalikan OK agar ping tes dari Midtrans mendapat HTTP 200 OK
    return { status: 'OK' };
  }
}

export const simulationEnabled = () => process.env.DEMO_MODE !== 'false'