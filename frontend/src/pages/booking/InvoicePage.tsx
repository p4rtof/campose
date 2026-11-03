import { useEffect, useState } from 'react'
import { Logo } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { WA } from '@/data/config'
import { FlowSteps } from '@/features/booking/FlowSteps'
import { fmt } from '@/lib/format'
import { navigate } from '@/lib/router'

/* ── helpers ──────────────────────────────────────────────────── */

const fmtDate = (iso: string | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

const calcTotal = (b: any) => {
  const pkgPrice = b.package?.price || 0
  const addonsTotal = (b.addons || []).reduce((s: number, a: any) => {
    return s + (a.price || a.addon?.price || 0) * (a.qty || 1)
  }, 0)
  return Math.max(0, pkgPrice + addonsTotal - (b.discount || 0))
}

/* ════════════════════════════════════════════════════════════════
   InvoicePage  —  customer-facing invoice
   On screen : embedded in the normal site layout (Navbar/Footer)
   On print  : standalone formal A4 document (all chrome hidden)
   ════════════════════════════════════════════════════════════════ */

export function InvoicePage() {
  const code = new URLSearchParams(window.location.search).get('code') || ''

  const [bk, setBk] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ── fetch booking from API ──────────────────────────────── */
  useEffect(() => {
    if (!code) {
      setError('Kode booking tidak ditemukan di URL')
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/bookings/${code}`)
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          setError(d.error?.message || `HTTP ${res.status}`)
          setLoading(false)
          return
        }
        const d = await res.json()
        if (d.success && d.data) {
          setBk(d.data)
        } else {
          setError(d.error?.message || 'Respons tidak valid')
        }
      } catch {
        setError('Gagal memuat data booking. Periksa koneksi internet.')
      } finally {
        setLoading(false)
      }
    })()
  }, [code])

  /* ── loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <section className="silk-light py-8 md:py-12 md:min-h-[900px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8" data-noprint>
          <FlowSteps step={2} />
          <div className="mt-8 md:mt-10 max-w-[860px] mx-auto card p-8 md:p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-ink/60">Memuat data invoice...</p>
          </div>
        </div>
      </section>
    )
  }

  /* ── error ───────────────────────────────────────────────── */
  if (error || !bk) {
    return (
      <section className="silk-light py-8 md:py-12 md:min-h-[900px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8" data-noprint>
          <FlowSteps step={2} />
          <div className="mt-8 md:mt-10 max-w-[860px] mx-auto card p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 grid place-items-center mx-auto mb-4">
              <Icon n="x" s={32} />
            </div>
            <h1 className="text-2xl font-bold text-ink mb-2">Invoice Tidak Ditemukan</h1>
            <p className="text-ink/60 mb-6">{error || 'Data booking tidak dapat dimuat.'}</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </section>
    )
  }

  const paid = bk.status === 'TERKONFIRMASI'
  const total = calcTotal(bk)

  /* ── line items for the pricing table ────────────────────── */
  const pkgPrice = bk.package?.price || 0
  const activeAddons = bk.addons || []
  const addonsSubtotal = activeAddons.reduce((s: number, a: any) => {
    return s + (a.price || a.addon?.price || 0) * (a.qty || 1)
  }, 0)
  const subtotalBeforeDiscount = pkgPrice + addonsSubtotal

  return (
    <section className="silk-light py-8 md:py-12 md:min-h-[900px]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 print-invoice-card-container">

        {/* Flow steps — screen only */}
        <div data-noprint>
          <FlowSteps step={2} />
        </div>

        {/* ═══════════════════════════════════════════════════════
            INVOICE DOCUMENT
            Printed as a standalone A4 formal document.
            On-screen it sits inside the normal card wrapper.
           ═══════════════════════════════════════════════════════ */}
        <div className="mt-8 md:mt-10 max-w-[860px] mx-auto card overflow-hidden bg-white print-invoice-card">

          {/* ── HEADER ──────────────────────────────────────── */}
          <div className="bg-brand text-white px-6 py-6 md:px-10 md:py-8 print-invoice-header">
            <div className="flex items-start justify-between">
              <div>
                <Logo light size={36} />
                <p className="mt-3 text-white/70 text-xs leading-relaxed">
                  PT Campose Indonesia<br />
                  campose.indonesia@gmail.com<br />
                  +62 821-2477-8747
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[.2em] text-white/60">Invoice</p>
                <p className="text-2xl md:text-3xl font-extrabold mt-1">#{bk.code}</p>
                <p className="text-sm text-white/80 mt-2">Tanggal: {fmtDate(bk.createdAt)}</p>
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                      paid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <i className={`w-1.5 h-1.5 rounded-full ${paid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {paid ? 'LUNAS' : 'BELUM BAYAR'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── BILLING + EVENT INFO ────────────────────────── */}
          <div className="px-6 md:px-10 pt-7 pb-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bill To */}
            <div>
              <p className="text-[11px] uppercase tracking-[.18em] font-bold text-slate-400 mb-2">
                Ditagihkan Kepada
              </p>
              <p className="font-semibold text-base text-ink">{bk.customerName}</p>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {bk.email}<br />
                {bk.whatsapp}
              </p>
            </div>

            {/* Event details */}
            <div>
              <p className="text-[11px] uppercase tracking-[.18em] font-bold text-slate-400 mb-2">
                Detail Acara
              </p>
              <div className="text-sm text-slate-700 space-y-1">
                {bk.eventName && (
                  <p className="font-semibold text-ink">{bk.eventName}</p>
                )}
                <p>
                  <span className="text-slate-400 inline-block w-16">Tanggal</span>
                  {fmtDate(bk.eventDate)}
                </p>
                <p>
                  <span className="text-slate-400 inline-block w-16">Waktu</span>
                  {bk.startTime && bk.endTime
                    ? `${bk.startTime} – ${bk.endTime} WIB`
                    : '—'}
                </p>
                <p>
                  <span className="text-slate-400 inline-block w-16">Lokasi</span>
                  {bk.location || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* ── ITEMIZED TABLE ──────────────────────────────── */}
          <div className="px-6 md:px-10 pt-4 pb-6">
            <table className="w-full text-sm print-invoice-table">
              <thead>
                <tr className="border-b-2 border-brand/20 text-left">
                  <th className="py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Item / Layanan</th>
                  <th className="py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center w-16">Qty</th>
                  <th className="py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right w-36">Harga Satuan</th>
                  <th className="py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right w-36">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* 1. Base Package Row */}
                <tr>
                  <td className="py-3.5 text-ink">
                    <div className="font-semibold text-slate-900">
                      Paket Photobooth {bk.package?.name || '—'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Unlimited prints · Custom template frame · Standar props & backdrop
                    </div>
                  </td>
                  <td className="py-3.5 text-center text-slate-600 font-medium">1</td>
                  <td className="py-3.5 text-right text-slate-600 tabular-nums">{fmt(pkgPrice)}</td>
                  <td className="py-3.5 text-right font-semibold text-slate-900 tabular-nums">{fmt(pkgPrice)}</td>
                </tr>

                {/* 2. Add-on Items Rows */}
                {activeAddons.length > 0 && activeAddons.map((a: any, idx: number) => {
                  const up = a.price || a.addon?.price || 0
                  const q = a.qty || 1
                  const rowTotal = up * q
                  return (
                    <tr key={idx} className="bg-blue-50/20 print:bg-transparent">
                      <td className="py-3 text-ink">
                        <div className="flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-brand shrink-0" />
                          <span className="font-medium text-slate-800">{a.addon?.name || a.name || 'Add-on'}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-100/70 text-brand px-1.5 py-0.5 rounded border border-blue-200/50 print:border-slate-300">
                            Add-on
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center text-slate-700 font-medium tabular-nums">{q}</td>
                      <td className="py-3 text-right text-slate-600 tabular-nums">{fmt(up)}</td>
                      <td className="py-3 text-right font-medium text-slate-900 tabular-nums">{fmt(rowTotal)}</td>
                    </tr>
                  )
                })}

                {/* 3. Transport Row */}
                <tr>
                  <td className="py-3 text-ink">
                    <div className="text-slate-700">Biaya Transport Wilayah Jabodetabek</div>
                    <div className="text-xs text-slate-400">Gratis ongkir untuk area operasional Jabodetabek</div>
                  </td>
                  <td className="py-3 text-center text-slate-400">—</td>
                  <td className="py-3 text-right text-emerald-600 font-medium">Gratis</td>
                  <td className="py-3 text-right text-emerald-600 font-medium">Rp0</td>
                </tr>
              </tbody>
            </table>

            {/* ── SUBTOTALS & FINANCIAL BREAKDOWN ───────────── */}
            <div className="mt-5 border-t-2 border-slate-200 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Summary note / item count */}
                <div className="text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">Rincian Pembiayaan</p>
                  <p>• Paket Photobooth: <span className="font-medium text-slate-700">{fmt(pkgPrice)}</span></p>
                  <p>• Layanan Tambahan (Add-on): <span className="font-medium text-slate-700">{activeAddons.length} item ({fmt(addonsSubtotal)})</span></p>
                  <p>• Biaya Transportasi: <span className="text-emerald-600 font-medium">Gratis (Jabodetabek)</span></p>
                </div>

                {/* Detailed calculation box */}
                <div className="w-full sm:max-w-xs space-y-2 text-sm bg-slate-50/90 p-4 rounded-xl border border-slate-200/70 print:bg-white print:border-slate-300">
                  <div className="flex justify-between text-slate-600">
                    <span>Harga Paket (Base)</span>
                    <span className="font-medium tabular-nums text-slate-800">{fmt(pkgPrice)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      Subtotal Add-on
                      {activeAddons.length > 0 && (
                        <span className="text-[11px] font-semibold text-brand">({activeAddons.length})</span>
                      )}
                    </span>
                    <span className="font-medium tabular-nums text-slate-800">{fmt(addonsSubtotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-700 pt-1.5 border-t border-slate-200">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-semibold tabular-nums text-slate-900">{fmt(subtotalBeforeDiscount)}</span>
                  </div>

                  {bk.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Diskon Voucher ({bk.voucherCode})</span>
                      <span className="tabular-nums">-{fmt(bk.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t-2 border-brand pt-2.5 mt-2">
                    <span className="text-base font-bold text-ink">Total Akhir</span>
                    <span className="text-xl font-extrabold text-brand tabular-nums">{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── PAYMENT INFO ───────────────────────────────── */}
          <div className="mx-6 md:mx-10 border-t border-dashed border-slate-300 py-5">
            <p className="text-[11px] uppercase tracking-[.18em] font-bold text-slate-400 mb-3">
              Instruksi Pembayaran
            </p>
            <div className="text-sm text-slate-600 leading-relaxed">
              <p>Transfer ke <strong className="text-ink">BCA 123 456 7890</strong> a.n. <strong className="text-ink">PT Campose Indonesia</strong></p>
              <p className="mt-1">Pastikan nominal sesuai total tagihan. Konfirmasi pembayaran melalui halaman pembayaran atau hubungi CS.</p>
            </div>
            {bk.paidAt && (
              <p className="mt-3 text-emerald-600 font-semibold text-sm">
                ✓ Dibayar pada {fmtDate(bk.paidAt)}
              </p>
            )}
          </div>

          {/* ── FOOTER — always visible, formal invoice footer ──── */}
          <div className="bg-slate-50 px-6 md:px-10 py-4 text-center text-xs text-slate-400 border-t border-slate-100">
            <p>Invoice ini diterbitkan secara otomatis oleh <strong className="text-slate-500">PT Campose Indonesia</strong></p>
            <p className="mt-0.5">campose.id · campose.indonesia@gmail.com · +62 821-2477-8747</p>
            <p className="mt-0.5">Dokumen ini sah sebagai bukti pemesanan tanpa memerlukan tanda tangan.</p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            ACTION BUTTONS — screen only (hidden on print)
           ═══════════════════════════════════════════════════════ */}
        <div data-noprint className="mt-6 max-w-[860px] mx-auto flex flex-col md:flex-row gap-3 md:gap-4 mb-12">
          {!paid && (
            <button
              onClick={() => navigate(`/pembayaran?code=${code}`)}
              className="btn btn-primary !h-14 md:flex-1 text-base"
            >
              Bayar Sekarang
            </button>
          )}
          <button onClick={() => window.print()} className="btn btn-outline !h-14">
            <Icon n="download" s={18} /> Cetak / Simpan PDF
          </button>
          <a href={WA} target="_blank" rel="noreferrer" className="btn btn-outline !h-14">
            <Icon n="chat" s={18} /> Hubungi CS
          </a>
        </div>

      </div>
    </section>
  )
}
