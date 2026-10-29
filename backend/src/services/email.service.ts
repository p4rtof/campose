import nodemailer from 'nodemailer'

// Inisialisasi transporter email
function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
  const user = process.env.SMTP_USER || process.env.EMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
  }

  if (user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })
  }

  // Fallback dev transporter: log ke console tanpa gagal/melempar error jika belum ada akun SMTP
  return nodemailer.createTransport({
    jsonTransport: true,
  })
}

const transporter = getTransporter()
const DEFAULT_FROM = process.env.SMTP_FROM || '"Campose Photobooth" <hello@campose.id>'

export interface BookingEmailData {
  code: string
  customerName: string
  email: string
  whatsapp: string
  eventDate: Date | string
  startTime: string
  endTime: string
  location: string
  eventName?: string | null
  eventType?: string
  total: number
  package: {
    name: string
    hours: number
    price?: number
  }
  addons?: Array<{
    addon?: { name: string }
    qty: number
    price: number
  }>
  adminNote?: string | null
}

export function formatRupiah(n: number) {
  return 'Rp' + (n || 0).toLocaleString('id-ID')
}

export function formatDateIndo(dateStr: Date | string) {
  try {
    const raw = typeof dateStr === 'string' ? (dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`) : dateStr
    return new Date(raw).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return String(dateStr)
  }
}

/**
 * Kirim email konfirmasi (ACC) pembayaran & detail pesanan lengkap ke customer
 */
export async function sendBookingConfirmedEmail(data: BookingEmailData) {
  const formattedDate = formatDateIndo(data.eventDate)
  const formattedTotal = formatRupiah(data.total)
  const addonList = (data.addons && data.addons.length > 0)
    ? data.addons.map((a) => `${a.addon?.name || 'Add-on'} (${a.qty}x)`).join(', ')
    : 'Tidak ada'

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Booking Campose Photobooth</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fb; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1A76D2 0%, #0D47A1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .badge-success { display: inline-block; background-color: #10b981; color: white; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-top: 14px; }
    .body { padding: 32px 24px; }
    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
    .intro { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .card-title { font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 14px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
    .row .label { color: #64748b; font-weight: 500; }
    .row .value { color: #0f172a; font-weight: 600; text-align: right; }
    .total-row { border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 12px; font-size: 15px; }
    .total-row .value { color: #1a76d2; font-size: 18px; font-weight: 800; }
    .note-box { background-color: #eff6ff; border-left: 4px solid #1a76d2; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 13px; color: #1e40af; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; background-color: #1a76d2; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CAMPOSE PHOTOBOOTH</h1>
      <p>Instant Memories, Endless Fun</p>
      <div class="badge-success">✓ PEMBAYARAN DI-ACC / LUNAS</div>
    </div>
    <div class="body">
      <div class="greeting">Halo, ${data.customerName}! 👋</div>
      <p class="intro">
        Kabar gembira! Bukti pembayaran untuk pesanan photobooth Anda dengan kode booking <b>${data.code}</b> telah <b>dikonfirmasi dan disetujui (ACC) oleh admin</b>. Jadwal photobooth Anda telah resmi terdaftar dalam kalender operasional kami.
      </p>

      <div class="card">
        <div class="card-title">📋 Rincian Jadwal & Pemesanan</div>
        <div class="row"><span class="label">Kode Booking</span><span class="value">${data.code}</span></div>
        <div class="row"><span class="label">Nama Pemesan</span><span class="value">${data.customerName}</span></div>
        <div class="row"><span class="label">Nomor WhatsApp</span><span class="value">${data.whatsapp}</span></div>
        <div class="row"><span class="label">Tanggal Acara</span><span class="value">${formattedDate}</span></div>
        <div class="row"><span class="label">Waktu Layanan</span><span class="value">${data.startTime} – ${data.endTime} WIB (${data.package.hours} Jam)</span></div>
        <div class="row"><span class="label">Paket Photobooth</span><span class="value">${data.package.name}</span></div>
        <div class="row"><span class="label">Lokasi / Venue</span><span class="value">${data.location}</span></div>
        <div class="row"><span class="label">Nama / Jenis Acara</span><span class="value">${data.eventName || data.eventType || 'Event Photobooth'}</span></div>
        <div class="row"><span class="label">Add-on Terpilih</span><span class="value">${addonList}</span></div>
        <div class="row total-row"><span class="label">Total Pembayaran</span><span class="value">${formattedTotal}</span></div>
      </div>

      ${data.adminNote ? `
      <div class="note-box">
        <b>Catatan dari Admin:</b><br />
        ${data.adminNote}
      </div>` : ''}

      <div class="card" style="background-color: #fffbeb; border-color: #fef3c7;">
        <div class="card-title" style="color: #92400e; border-color: #fde68a;">📌 Persiapan di Hari Acara:</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #78350f; line-height: 1.6;">
          <li>Tim kru Campose akan tiba di lokasi <b>30–45 menit sebelum acara</b> untuk persiapan setup alat dan lighting.</li>
          <li>Mohon sediakan area minimum <b>2.5 x 2.5 meter</b> dan <b>1 stopkontak listrik</b> di dekat area photobooth.</li>
          <li>Jika ada perubahan denah atau kontak PIC lokasi, mohon infokan kepada tim kami via WhatsApp.</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Ada pertanyaan terkait persiapan acara Anda?</p>
        <a href="https://wa.me/6281234567890?text=Halo%20Admin%20Campose,%20saya%20ingin%20bertanya%20mengenai%20booking%20${data.code}" class="btn">
          💬 Hubungi Admin via WhatsApp
        </a>
      </div>
    </div>
    <div class="footer">
      <p><b>Campose Photobooth Official</b><br />
      Email: support@campose.id | Instagram: @campose.id</p>
      <p style="margin-top: 8px; color: #94a3b8;">Email ini dibuat secara otomatis oleh sistem Campose Photobooth.</p>
    </div>
  </div>
</body>
</html>
  `

  try {
    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to: data.email,
      subject: `[Campose Photobooth] Konfirmasi Pembayaran Booking ${data.code} Disetujui!`,
      html,
    })
    console.log(`✉️ Email konfirmasi booking terkirim ke ${data.email} (${data.code}). MessageId:`, info.messageId || 'local-json')
    return { success: true, info }
  } catch (err) {
    console.error(`❌ Gagal mengirim email konfirmasi ke ${data.email}:`, err)
    return { success: false, error: err }
  }
}

/**
 * Kirim email penolakan bukti pembayaran ke customer
 */
export async function sendBookingRejectedEmail(data: BookingEmailData, reason?: string) {
  const formattedDate = formatDateIndo(data.eventDate)
  const formattedTotal = formatRupiah(data.total)
  const rejectionReason = reason || data.adminNote || 'Bukti pembayaran tidak terbaca, buram, atau nominal transfer tidak sesuai.'

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pemberitahuan Pembayaran Campose Photobooth</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fb; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
    .badge-danger { display: inline-block; background-color: #ffe4e6; color: #9f1239; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-top: 14px; }
    .body { padding: 32px 24px; }
    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
    .intro { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .card-title { font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 14px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
    .row .label { color: #64748b; font-weight: 500; }
    .row .value { color: #0f172a; font-weight: 600; text-align: right; }
    .alert-box { background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 16px; border-radius: 6px; margin-bottom: 24px; font-size: 14px; color: #9f1239; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; background-color: #1a76d2; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CAMPOSE PHOTOBOOTH</h1>
      <p>Instant Memories, Endless Fun</p>
      <div class="badge-danger">✕ BUKTI PEMBAYARAN PERLU DIPERBAIKI</div>
    </div>
    <div class="body">
      <div class="greeting">Halo, ${data.customerName}! 👋</div>
      <p class="intro">
        Terima kasih telah melakukan pemesanan di Campose Photobooth. Kami menginformasikan bahwa bukti transfer pembayaran yang Anda unggah untuk booking <b>${data.code}</b> belum dapat disetujui oleh admin kami.
      </p>

      <div class="alert-box">
        <b>Alasan Penolakan:</b><br />
        ${rejectionReason}
      </div>

      <div class="card">
        <div class="card-title">📋 Ringkasan Pesanan</div>
        <div class="row"><span class="label">Kode Booking</span><span class="value">${data.code}</span></div>
        <div class="row"><span class="label">Tanggal Acara</span><span class="value">${formattedDate}</span></div>
        <div class="row"><span class="label">Waktu Layanan</span><span class="value">${data.startTime} – ${data.endTime} WIB</span></div>
        <div class="row"><span class="label">Paket</span><span class="value">${data.package.name}</span></div>
        <div class="row"><span class="label">Total Yang Harus Dibayar</span><span class="value">${formattedTotal}</span></div>
      </div>

      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Jangan khawatir, slot waktu Anda tetap kami simpan sementara. Silakan unggah kembali foto bukti transfer yang jelas dan sesuai nominal melalui halaman pesanan Anda:
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="http://localhost:5173/invoice?code=${data.code}" class="btn">
          📸 Unggah Ulang Bukti Pembayaran
        </a>
      </div>
    </div>
    <div class="footer">
      <p><b>Campose Photobooth Official</b><br />
      Email: support@campose.id | WhatsApp: 0812-3456-7890</p>
      <p style="margin-top: 8px; color: #94a3b8;">Email ini dibuat secara otomatis oleh sistem Campose Photobooth.</p>
    </div>
  </div>
</body>
</html>
  `

  try {
    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to: data.email,
      subject: `[Campose Photobooth] Bukti Pembayaran Perlu Diperbaiki - Booking ${data.code}`,
      html,
    })
    console.log(`✉️ Email penolakan booking terkirim ke ${data.email} (${data.code}). MessageId:`, info.messageId || 'local-json')
    return { success: true, info }
  } catch (err) {
    console.error(`❌ Gagal mengirim email penolakan ke ${data.email}:`, err)
    return { success: false, error: err }
  }
}

export const sendInvoiceEmail = async (email: string, nama: string, orderId: string) => {
  await transporter.sendMail({
    from: DEFAULT_FROM,
    to: email,
    subject: `Pembayaran Berhasil - Booking #${orderId}`,
    html: `<h3>Halo ${nama}!</h3>
           <p>Pembayaran untuk booking Photobooth <b>#${orderId}</b> sudah LUNAS.</p>
           <p>Terima kasih sudah memilih Campose. Sampai jumpa di acaramu!</p>`,
  })
}
