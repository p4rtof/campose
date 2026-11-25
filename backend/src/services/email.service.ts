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

// DEFAULT_FROM menyesuaikan akun Gmail yang dikonfigurasi agar cocok dengan akun SMTP
const DEFAULT_FROM =
  process.env.SMTP_FROM ||
  `"Campose Photobooth" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'hello@campose.id'}>`

/**
 * Kembalikan daftar email admin tujuan notifikasi.
 * Baca dari ADMIN_NOTIFICATION_EMAIL (comma-separated), fallback ke akun SMTP.
 */
function getAdminNotificationEmails(): string[] {
  const raw = process.env.ADMIN_NOTIFICATION_EMAIL
  if (raw) {
    const list = raw.split(',').map((e) => e.trim()).filter(Boolean)
    if (list.length > 0) return list
  }
  const fallback = process.env.SMTP_USER || process.env.EMAIL_USER
  return fallback ? [fallback] : []
}

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
        <div class="row"><span class="label">Kode Booking : </span><span class="value"> ${data.code}</span></div>
        <div class="row"><span class="label">Nama Pemesan : </span><span class="value"> ${data.customerName}</span></div>
        <div class="row"><span class="label">Nomor WhatsApp : </span><span class="value"> ${data.whatsapp}</span></div>
        <div class="row"><span class="label">Tanggal Acara : </span><span class="value"> ${formattedDate}</span></div>
        <div class="row"><span class="label">Waktu Layanan : </span><span class="value"> ${data.startTime} –  ${data.endTime} WIB ( ${data.package.hours} Jam)</span></div>
        <div class="row"><span class="label">Paket Photobooth : </span><span class="value"> ${data.package.name}</span></div>
        <div class="row"><span class="label">Lokasi / Venue : </span><span class="value"> ${data.location}</span></div>
        <div class="row"><span class="label">Nama / Jenis Acara : </span><span class="value"> ${data.eventName || data.eventType || 'Event Photobooth'}</span></div>
        <div class="row"><span class="label">Add-on Terpilih : </span><span class="value"> ${addonList}</span></div>
        <div class="row total-row"><span class="label">Total Pembayaran : </span><span class="value"> ${formattedTotal}</span></div>
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
    const adminEmails = getAdminNotificationEmails()
    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to: data.email,
      replyTo: adminEmails[0] || DEFAULT_FROM,
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
        <div class="row"><span class="label">Kode Booking : </span><span class="value">${data.code}</span></div>
        <div class="row"><span class="label">Tanggal Acara : </span><span class="value">${formattedDate}</span></div>
        <div class="row"><span class="label">Waktu Layanan : </span><span class="value">${data.startTime} – ${data.endTime} WIB</span></div>
        <div class="row"><span class="label">Paket : </span><span class="value">${data.package.name}</span></div>
        <div class="row"><span class="label">Total Yang Harus Dibayar : </span><span class="value">${formattedTotal}</span></div>
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
    const adminEmails = getAdminNotificationEmails()
    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to: data.email,
      replyTo: adminEmails[0] || DEFAULT_FROM,
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

// ─────────────────────────────────────────────────────────────────────────────
// Kemitraan / Partnership notification
// ─────────────────────────────────────────────────────────────────────────────

export interface PartnershipEmailData {
  nama: string
  email: string
  no_wa: string
  jenis: string
  pesan: string
}

/**
 * Kirim notifikasi pengajuan kemitraan ke email admin (fadhla153@gmail.com)
 */
export async function sendPartnershipEmail(data: PartnershipEmailData) {
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengajuan Kemitraan Baru – Campose</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fb; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1A76D2 0%, #0D47A1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .badge { display: inline-block; background-color: #fbbf24; color: #78350f; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-top: 14px; }
    .body { padding: 32px 24px; }
    .intro { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .card-title { font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 14px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; gap: 12px; }
    .row .label { color: #64748b; font-weight: 500; white-space: nowrap; }
    .row .value { color: #0f172a; font-weight: 600; text-align: right; }
    .pesan-box { background-color: #eff6ff; border-left: 4px solid #1a76d2; padding: 14px 16px; border-radius: 6px; font-size: 13px; color: #1e3a5f; line-height: 1.6; white-space: pre-wrap; }
    .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CAMPOSE PHOTOBOOTH</h1>
      <p>Instant Memories, Endless Fun</p>
      <div class="badge">🤝 Pengajuan Kemitraan Baru</div>
    </div>
    <div class="body">
      <p class="intro">
        Halo Admin! Ada pengajuan <b>${data.jenis}</b> baru yang masuk melalui halaman Kemitraan Campose. Berikut detail calon mitra:
      </p>

      <div class="card">
        <div class="card-title">📋 Data Calon Mitra</div>
        <div class="row"><span class="label">Nama Lengkap : </span><span class="value"> ${data.nama}</span></div>
        <div class="row"><span class="label">Email : </span><span class="value"> ${data.email}</span></div>
        <div class="row"><span class="label">Nomor WhatsApp : </span><span class="value"> ${data.no_wa}</span></div>
        <div class="row"><span class="label">Jenis Pengajuan : </span><span class="value"> ${data.jenis}</span></div>
      </div>

      <div class="card">
        <div class="card-title">💬 Pesan / Alasan Pengajuan</div>
        <div class="pesan-box">${data.pesan}</div>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
        Segera tindak lanjuti pengajuan ini dengan menghubungi calon mitra via WhatsApp atau email di atas dalam <b>1–2 hari kerja</b>.
      </p>
    </div>
    <div class="footer">
      <p><b>Campose Photobooth Admin System</b><br/>Notifikasi otomatis dari sistem kemitraan</p>
      <p style="margin-top: 6px; color: #94a3b8;">Email ini dikirim karena ada pengajuan baru di campose.id/kemitraan</p>
    </div>
  </div>
</body>
</html>
  `

  try {
    // Gunakan env ADMIN_NOTIFICATION_EMAIL, fallback ke fadhla153@gmail.com
    const adminEmails = getAdminNotificationEmails()
    const recipients = adminEmails.length > 0 ? adminEmails : ['fadhla153@gmail.com']
    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to: recipients.join(', '),
      replyTo: data.email,
      subject: `[Campose] Pengajuan ${data.jenis} Baru dari ${data.nama}`,
      html,
    })
    console.log(`✉️  Email kemitraan terkirim ke ${recipients.join(', ')} dari ${data.email}. MessageId:`, info.messageId || 'local-json')
    return { success: true, info }
  } catch (err) {
    console.error(`❌ Gagal mengirim email kemitraan:`, err)
    return { success: false, error: err }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin payment-proof notification
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminPaymentNotifData {
  /** Kode booking, contoh: CMP-2026-0042 */
  code: string
  /** Nama customer */
  customerName: string
  /** Email customer (dipakai sebagai replyTo) */
  email: string
  /** Nomor WhatsApp customer, format bebas */
  whatsapp: string
  /** Nama paket, misal "Paket Bronze 2 Jam" */
  packageName: string
  /** Add-on yang dipilih */
  addons?: Array<{ name: string; qty: number; price: number }>
  /** Tanggal acara */
  eventDate: Date | string
  /** Waktu mulai, contoh "09.00" */
  startTime: string
  /** Waktu selesai, contoh "11.00" */
  endTime: string
  /** Lokasi / venue */
  location: string
  /** Metode pembayaran */
  method: string
  /** Total tagihan dalam Rupiah */
  total: number
  /** URL publik foto bukti bayar */
  proofUrl: string
  /** true jika ini adalah re-upload setelah ditolak */
  isReupload: boolean
  /** Waktu customer upload (default: now) */
  uploadedAt?: Date
}

/**
 * Kirim email notifikasi ke admin saat customer upload (atau re-upload) bukti pembayaran.
 * Fire-and-forget — gunakan .catch() di pemanggil agar tidak memblokir response HTTP.
 */
export async function sendAdminPaymentNotificationEmail(data: AdminPaymentNotifData) {
  const adminEmails = getAdminNotificationEmails()
  if (adminEmails.length === 0) {
    console.warn('⚠️  Tidak ada ADMIN_NOTIFICATION_EMAIL / SMTP_USER di .env — email notifikasi admin dilewati.')
    return { success: false }
  }

  const apiBase    = process.env.API_PUBLIC_URL || 'https://api.campose.web.id'
  const adminUrl   = `${process.env.ADMIN_DASHBOARD_URL || 'https://campose.web.id/admin'}/pembayaran`
  const uploadedAt = data.uploadedAt || new Date()

  const uploadedAtStr = uploadedAt.toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  }) + ' WIB'

  const formattedDate  = formatDateIndo(data.eventDate)
  const formattedTotal = formatRupiah(data.total)

  // Format nomor WA untuk link wa.me (hapus awalan 0, ganti dengan 62)
  const waNumber = data.whatsapp.replace(/^0/, '62').replace(/\D/g, '')
  const waLink   = `https://wa.me/${waNumber}`

  const addonRows = (data.addons && data.addons.length > 0)
    ? data.addons.map((a) =>
        `<div class="row"><span class="label">+ ${a.name} (${a.qty}x)</span><span class="value">${formatRupiah(a.price * a.qty)}</span></div>`
      ).join('\n')
    : '<div class="row"><span class="label" style="color:#94a3b8;font-style:italic;">Tidak ada add-on</span><span class="value">–</span></div>'

  const isReupload  = data.isReupload
  const badgeColor  = isReupload ? '#f59e0b' : '#3b82f6'
  const badgeText   = isReupload ? '🔁 UPLOAD ULANG BUKTI PEMBAYARAN' : '🔔 MENUNGGU KONFIRMASI PEMBAYARAN'
  const headerGrad  = isReupload
    ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
    : 'linear-gradient(135deg, #1A76D2 0%, #0D47A1 100%)'

  // Tentukan apakah proofUrl sudah absolute atau masih path relatif
  const proofAbsolute = data.proofUrl.startsWith('http') ? data.proofUrl : `${apiBase}${data.proofUrl}`

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notifikasi Bukti Pembayaran – Campose</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fb; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: ${headerGrad}; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
    .header p { margin: 8px 0 0; font-size: 13px; opacity: 0.9; }
    .badge { display: inline-block; background-color: ${badgeColor}; color: #fff; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-top: 14px; letter-spacing: 0.5px; }
    .body { padding: 32px 24px; }
    .intro { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .card-title { font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 14px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 9px; font-size: 13px; gap: 12px; }
    .row .label { color: #64748b; font-weight: 500; }
    .row .value { color: #0f172a; font-weight: 600; text-align: right; }
    .row .value a { color: #1a76d2; text-decoration: none; }
    .total-row { border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 10px; font-size: 14px; }
    .total-row .value { color: #1a76d2; font-size: 16px; font-weight: 800; }
    .proof-box { text-align: center; margin-bottom: 20px; }
    .proof-box img { max-width: 100%; border-radius: 10px; border: 2px solid #e2e8f0; max-height: 300px; object-fit: cover; }
    .proof-link { display: inline-block; margin-top: 10px; font-size: 12px; color: #1a76d2; text-decoration: none; word-break: break-all; }
    .cta { text-align: center; margin: 24px 0 8px; }
    .btn { display: inline-block; background-color: #1a76d2; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; }
    .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CAMPOSE PHOTOBOOTH</h1>
      <p>Notifikasi Admin – Verifikasi Bukti Pembayaran</p>
      <div class="badge">${badgeText}</div>
    </div>
    <div class="body">
      <p class="intro">
        ${isReupload
          ? `Customer telah <b>mengupload ulang</b> bukti pembayaran untuk booking <b>${data.code}</b> setelah sebelumnya ditolak. Silakan verifikasi kembali.`
          : `Ada <b>bukti pembayaran baru</b> yang perlu dikonfirmasi untuk booking <b>${data.code}</b>. Segera verifikasi melalui dashboard admin.`
        }
      </p>

      <!-- Data Customer & Booking -->
      <div class="card">
        <div class="card-title">👤 Data Customer & Booking</div>
        <div class="row"><span class="label">Kode Booking : </span><span class="value">${data.code}</span></div>
        <div class="row"><span class="label">Nama Customer : </span><span class="value">${data.customerName}</span></div>
        <div class="row"><span class="label">Email : </span><span class="value"><a href="mailto:${data.email}">${data.email}</a></span></div>
        <div class="row"><span class="label">WhatsApp : </span><span class="value"><a href="${waLink}" target="_blank">${data.whatsapp}</a></span></div>
        <div class="row"><span class="label">Paket : </span><span class="value">${data.packageName}</span></div>
        <div class="row"><span class="label">Tanggal Acara : </span><span class="value">${formattedDate}</span></div>
        <div class="row"><span class="label">Waktu Layanan : </span><span class="value">${data.startTime} – ${data.endTime} WIB</span></div>
        <div class="row"><span class="label">Lokasi / Venue : </span><span class="value">${data.location}</span></div>
        <div class="row"><span class="label">Metode Bayar : </span><span class="value">${data.method.replace(/_/g, ' ')}</span></div>
        <div class="row"><span class="label">Waktu Upload : </span><span class="value">${uploadedAtStr}</span></div>
      </div>

      <!-- Rincian Pembayaran -->
      <div class="card">
        <div class="card-title">💰 Rincian Pembayaran : </div>
        ${addonRows}
        <div class="row total-row"><span class="label">Total Tagihan : </span><span class="value">${formattedTotal}</span></div>
      </div>

      <!-- Preview Bukti Bayar -->
      <div class="card">
        <div class="card-title">🧾 Bukti Pembayaran</div>
        <div class="proof-box">
          <img src="${proofAbsolute}" alt="Bukti Pembayaran ${data.code}" />
          <br/>
          <a href="${proofAbsolute}" class="proof-link" target="_blank">🔗 Buka gambar penuh di tab baru</a>
        </div>
      </div>

      <div class="cta">
        <a href="${adminUrl}" class="btn">🔍 Buka Dashboard Admin – Verifikasi Sekarang</a>
      </div>
    </div>
    <div class="footer">
      <p><b>Campose Photobooth Admin System</b><br/>Notifikasi otomatis — jangan balas email ini langsung.</p>
      <p style="margin-top:6px;color:#94a3b8;">Balas email ini untuk menghubungi customer <b>${data.customerName}</b> secara langsung.</p>
    </div>
  </div>
</body>
</html>
  `

  const subject = isReupload
    ? `[Campose] Upload Ulang Bukti Pembayaran - ${data.code} (${data.customerName})`
    : `[Campose] Bukti Pembayaran Baru - ${data.code} (${data.customerName})`

  try {
    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to: adminEmails.join(', '),
      replyTo: data.email,
      subject,
      html,
    })
    console.log(`✉️  Notifikasi admin terkirim ke ${adminEmails.join(', ')} (${data.code}). MessageId:`, info.messageId || 'local-json')
    return { success: true, info }
  } catch (err) {
    console.error(`❌ Gagal mengirim notifikasi admin untuk ${data.code}:`, err)
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
