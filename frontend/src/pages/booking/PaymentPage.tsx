import { useEffect, useState, useRef } from 'react'
import { Aperture } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { WA } from '@/data/config'
import { FlowSteps } from '@/features/booking/FlowSteps'
import { resolved, useBooking, useCountdown } from '@/features/booking/booking-state'
import { fmt } from '@/lib/format'
import { Link } from '@/lib/router'

const BANKS = [
  { name: 'BCA', no: '1234567890', color: '#0060AF', holder: 'PT Campose Indonesia' },
  { name: 'BNI', no: '9876543210', color: '#F15A22', holder: 'PT Campose Indonesia' },
  { name: 'Mandiri', no: '1122334455', color: '#003D79', holder: 'PT Campose Indonesia' },
]

type PaymentStatus = 'PENDING' | 'MENUNGGU_KONFIRMASI' | 'PAID' | 'DITOLAK' | null

export function PaymentPage() {
  const { b } = useBooking()
  const r = resolved(b)
  const cd = useCountdown(23 * 3600 + 59 * 60)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'qris' | 'transfer'>('transfer')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(null)
  const [adminNote, setAdminNote] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const queryParams = new URLSearchParams(window.location.search)
  const invoiceCode = queryParams.get('code') || 'CMP-0001'
  const BASE_URL = 'http://localhost:4000'

  // Inisialisasi payment saat halaman dibuka
  useEffect(() => {
    const init = async () => {
      try {
        // Cek status dulu
        const statusRes = await fetch(`${BASE_URL}/api/v1/bookings/${invoiceCode}/payment-status`)
        const statusData = await statusRes.json()
        if (statusRes.ok && statusData.data) {
          setPaymentStatus(statusData.data.paymentStatus)
          setPaymentId(statusData.data.paymentId)
          setAdminNote(statusData.data.adminNote)
          if (statusData.data.paymentStatus) return // sudah ada payment
        }

        // Buat payment baru
        const res = await fetch(`${BASE_URL}/api/v1/bookings/${invoiceCode}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'TRANSFER_MANUAL' }),
        })
        const data = await res.json()
        if (res.ok && data.data?.id) {
          setPaymentId(data.data.id)
          setPaymentStatus(data.data.status)
        }
      } catch (e) {
        console.error('Init payment error:', e)
      }
    }
    init()
  }, [invoiceCode])

  // Polling status pembayaran setiap 5 detik
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/bookings/${invoiceCode}/payment-status`)
        const data = await res.json()
        if (res.ok && data.data) {
          setPaymentStatus(data.data.paymentStatus)
          setAdminNote(data.data.adminNote)
        }
      } catch (e) { /* silent */ }
    }
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [invoiceCode])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const copy = (v: string, label: string) => {
    navigator.clipboard?.writeText(v.replace(/\s/g, ''))
    setToast(`Nomor ${label} disalin!`)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file || !paymentId) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('proof', file)
      const res = await fetch(`${BASE_URL}/api/v1/payments/${paymentId}/upload-proof`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (res.ok) {
        setPaymentStatus('MENUNGGU_KONFIRMASI')
        setToast('Bukti pembayaran berhasil diunggah! Menunggu konfirmasi admin.')
        setPreview(null)
        setFile(null)
      } else {
        setToast(data.error?.message || 'Gagal mengunggah bukti.')
      }
    } catch {
      setToast('Terjadi kesalahan. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  // Status: PAID = sukses
  if (paymentStatus === 'PAID') {
    return (
      <section className="silk-light py-8 md:py-12 md:min-h-[900px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <FlowSteps step={4} />
          <div className="pop mt-8 md:mt-10 max-w-[720px] mx-auto card p-6 md:p-12 text-center">
            <span className="w-24 h-24 rounded-full bg-[#e3f7ec] text-[#1fa463] grid place-items-center mx-auto">
              <Icon n="check" s={48} />
            </span>
            <h1 className="mt-6 text-[28px] md:text-4xl font-extrabold uppercase">
              Pembayaran <span className="text-royal">Dikonfirmasi</span>
            </h1>
            <p className="mt-3 text-ink/70">
              Terima kasih, {r.nama.split(' ')[0]}! Booking kamu sudah dikonfirmasi oleh admin. Detail dikirim ke {r.email}.
            </p>
            <div className="mt-8 ticket bg-[#f6faff] rounded-2xl p-5 md:p-6 text-left grid grid-cols-1 md:grid-cols-2 gap-y-1 md:gap-y-3 text-sm break-words">
              <span className="text-ink/55">Invoice</span>
              <b className="md:text-right mb-2 md:mb-0">#{invoiceCode} · LUNAS</b>
              <span className="text-ink/55">Paket</span>
              <b className="md:text-right mb-2 md:mb-0">Photobooth {r.pkg.title}</b>
              <span className="text-ink/55">Jadwal</span>
              <b className="md:text-right mb-2 md:mb-0">{r.date}, {r.range}</b>
              <span className="text-ink/55">Lokasi</span>
              <b className="md:text-right mb-2 md:mb-0">{r.lokasi}</b>
              <span className="text-ink/55">Total dibayar</span>
              <b className="md:text-right text-royal mb-2 md:mb-0">{fmt(r.total)}</b>
            </div>
            <div className="mt-8 flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
              <a href={WA} target="_blank" rel="noreferrer" className="btn btn-primary !h-14">
                <Icon n="chat" s={18} /> Chat WhatsApp CS
              </a>
            </div>
            <Link to="/" className="inline-block mt-6 text-sm text-brand font-medium underline">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // Status: MENUNGGU_KONFIRMASI = sudah upload, tunggu admin
  if (paymentStatus === 'MENUNGGU_KONFIRMASI') {
    return (
      <section className="silk-light py-8 md:py-12 md:min-h-[900px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <FlowSteps step={3} />
          <div className="mt-8 md:mt-10 max-w-[600px] mx-auto card p-6 md:p-12 text-center">
            <span className="w-20 h-20 rounded-full bg-[#FFF4D6] text-[#9a6700] grid place-items-center mx-auto">
              <Icon n="clock" s={40} />
            </span>
            <h1 className="mt-6 text-2xl md:text-3xl font-extrabold uppercase">
              Menunggu <span className="text-royal">Konfirmasi Admin</span>
            </h1>
            <p className="mt-3 text-ink/70 text-sm">
              Bukti pembayaran kamu sudah kami terima dan sedang diverifikasi oleh tim kami.
              Biasanya proses ini membutuhkan waktu <b>1×24 jam</b>.
            </p>
            <div className="mt-6 p-4 rounded-2xl bg-[#FFF4D6] text-[#9a6700] text-sm">
              <b>Invoice:</b> #{invoiceCode} &nbsp;·&nbsp; <b>Total:</b> {fmt(r.total)}
            </div>
            <p className="mt-6 text-xs text-ink/50">Halaman ini akan otomatis ter-update saat admin mengkonfirmasi.</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <i className="w-2 h-2 rounded-full bg-[#f5a524] animate-pulse" />
              <span className="text-sm text-ink/60">Memantau status pembayaran...</span>
            </div>
            <a href={WA} target="_blank" rel="noreferrer" className="btn btn-outline !h-12 mt-8 inline-flex">
              <Icon n="chat" s={18} /> Hubungi CS via WhatsApp
            </a>
          </div>
        </div>
      </section>
    )
  }

  // Status: DITOLAK = perlu upload ulang
  const isRejected = paymentStatus === 'DITOLAK'

  return (
    <section className="silk-light py-8 md:py-12 md:min-h-[900px]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <FlowSteps step={3} />

        {isRejected && (
          <div className="mt-6 max-w-[1100px] mx-auto p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <b>⚠️ Bukti pembayaran ditolak.</b>{adminNote ? ` Alasan: ${adminNote}` : ''} Silakan upload ulang bukti yang benar.
          </div>
        )}

        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 md:gap-8 items-start max-w-[1100px] mx-auto">
          {/* Panel kiri: info rekening + upload */}
          <div className="space-y-5">
            {/* Tab pilih metode */}
            <div className="card p-5 md:p-8">
              <h1 className="text-[28px] md:text-3xl font-extrabold uppercase">
                Transfer & <span className="text-royal">Upload Bukti</span>
              </h1>
              <div className="mt-5 grid grid-cols-2 gap-3 p-1.5 rounded-full bg-[#eaf3fc]">
                {([['transfer', 'Transfer Bank'], ['qris', 'QRIS']] as const).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`h-12 rounded-full font-semibold text-[13px] md:text-sm transition ${tab === k ? 'bg-brand text-white shadow' : 'text-ink/70'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {tab === 'transfer' ? (
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-ink/60 mb-4">Transfer ke salah satu rekening di bawah ini:</p>
                  {BANKS.map(({ name, no, color, holder }) => (
                    <div key={name} className="flex flex-wrap items-center gap-3 md:gap-4 rounded-2xl border border-[#d6e4f5] p-4 hover:border-brand transition">
                      <span className="w-16 h-12 rounded-xl grid place-items-center text-white font-extrabold text-sm" style={{ background: color }}>{name}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-ink/55">Rekening {name} a.n. {holder}</div>
                        <div className="text-lg md:text-xl font-bold tracking-wider tabular-nums">{no}</div>
                      </div>
                      <button onClick={() => copy(no, `rek. ${name}`)} className="btn btn-outline !h-12 md:!h-10 !px-4 !text-sm">
                        <Icon n="copy" s={16} /> Salin
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <p className="text-sm text-ink/60 mb-4">Scan QRIS berikut lalu upload screenshot/bukti pembayaran:</p>
                  <div className="inline-flex p-4 rounded-3xl border-2 border-[#d6e4f5] relative">
                    <Aperture size={120} />
                    <span className="text-xs text-ink/50 mt-2 block">QRIS Campose</span>
                  </div>
                </div>
              )}
            </div>

            {/* Upload bukti */}
            <div className="card p-5 md:p-8">
              <h2 className="text-xl font-extrabold uppercase">Upload <span className="text-royal">Bukti Pembayaran</span></h2>
              <p className="mt-2 text-sm text-ink/60">
                Setelah transfer, upload screenshot/foto bukti pembayaran kamu (max 5MB, format JPG/PNG).
              </p>
              <div
                className="mt-5 border-2 border-dashed border-[#b8cbe3] rounded-2xl p-6 text-center cursor-pointer hover:border-brand transition"
                onClick={() => fileRef.current?.click()}
              >
                {preview ? (
                  <div className="space-y-3">
                    <img src={preview} alt="Preview bukti" className="max-h-48 mx-auto rounded-xl object-contain" />
                    <p className="text-sm text-ink/60">{file?.name}</p>
                    <button className="text-xs text-brand underline" onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null) }}>Ganti foto</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Icon n="download" s={32} className="mx-auto text-brand opacity-60 rotate-180" />
                    <p className="text-sm font-medium text-brand">Klik untuk pilih file</p>
                    <p className="text-xs text-ink/50">JPG, PNG, WEBP · Maks 5MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              <button
                onClick={handleUpload}
                disabled={!file || uploading || !paymentId}
                className="btn btn-primary w-full mt-5 !h-14 font-bold text-base justify-center items-center"
              >
                {uploading ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
              </button>
              {!paymentId && <p className="text-xs text-ink/50 text-center mt-2">Menghubungkan ke server...</p>}
            </div>
          </div>

          {/* Sidebar kanan */}
          <aside className="card p-5 md:p-7 md:sticky md:top-28">
            <span className="inline-flex items-center gap-2 bg-[#FFF4D6] text-[#9a6700] text-sm font-semibold px-4 py-2 rounded-full">
              <i className="w-2 h-2 rounded-full bg-[#f5a524] animate-pulse" />Menunggu Pembayaran
            </span>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink/55">Invoice</dt><dd className="font-semibold">#{invoiceCode}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/55">Paket</dt><dd className="font-semibold">Photobooth {r.pkg.title}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/55">Jadwal</dt><dd className="font-semibold text-right">{r.date}<br />{r.range}</dd></div>
            </dl>
            <div className="my-5 border-t-2 border-dashed border-[#d6e4f5]" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink/55">Harga Paket</dt><dd className="font-semibold">{fmt(r.pkg.price)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/55">Total Add On</dt><dd className="font-semibold">{fmt(r.addonTotal)}</dd></div>
              {r.discount > 0 && <div className="flex justify-between text-[#16a34a] font-semibold"><dt>Diskon Voucher</dt><dd>-{fmt(r.discount)}</dd></div>}
            </dl>
            <div className="mt-5 pt-4 border-t-2 border-dashed border-[#d6e4f5] flex justify-between items-end">
              <span className="font-extrabold uppercase tracking-wider text-sm">Total Harga</span>
              <span className="text-2xl font-extrabold text-royal">{fmt(r.total)}</span>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-[#f6faff] text-xs text-ink/60 space-y-1">
              <p>⏱ Batas waktu pembayaran:</p>
              <p className="text-2xl font-extrabold text-ink tabular-nums">{cd.h}:{cd.m}:{cd.s}</p>
            </div>
          </aside>
        </div>
      </div>
      {toast && <div className="pop fixed top-24 left-1/2 -translate-x-1/2 bg-brand text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 text-center w-max max-w-[90vw]">{toast}</div>}
    </section>
  )
}
