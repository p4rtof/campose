import { useEffect, useState } from 'react'
import { PAYCHIP, PKG, ADDONS, price, rp, useApp, Booking, BookingAddonItem, fd, BASE_URL } from './store'
import { A } from './router'
import { BackLink, Btn, Card, Crumbs, Icon, Modal, PageHead, cx } from './ui'
import { Logo as BrandLogo } from '@/components/Brand'

export function Payments() {
  const { bookings, toast } = useApp()
  const paid = bookings.filter((b) => b.pay === 'Lunas')
  const pend = bookings.filter((b) => b.pay === 'Menunggu' || b.pay === 'Bukti Diunggah')
  const pendingProof = bookings.filter((b) => b.pay === 'Bukti Diunggah')

  const sum = [
    ['Total Pendapatan', rp(paid.reduce((s, b) => s + price(b).total, 0)), 'card', 'bg-emerald-100 text-emerald-600'],
    ['Jumlah Lunas', paid.length + ' invoice', 'check', 'bg-blue-100 text-brand'],
    [
      'Menunggu Verifikasi',
      pendingProof.length + ' bukti diunggah',
      'clock',
      pendingProof.length > 0 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300' : 'bg-amber-100 text-amber-600',
    ],
  ]

  const exportCsv = () => {
    const headers = 'Invoice,Pemesan,WhatsApp,Metode,Nominal,Status,Waktu Bayar\n'
    const rows = bookings
      .map((b) => `"${b.inv}","${b.name}","${b.wa}","${b.method}",${price(b).total},"${b.pay}","${b.paidAt || '-'}"`)
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rekap-pembayaran-campose-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast('Rekap pembayaran.csv berhasil diekspor')
  }

  return (
    <div>
      <PageHead
        title="Pembayaran & Invoice"
        sub="Rekap verifikasi pembayaran manual dari customer"
        actions={<Btn icon="download" onClick={exportCsv}>Ekspor CSV</Btn>}
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {sum.map(([l, v, i, c]) => (
          <Card key={l} className="flex items-center gap-4 p-4">
            <span className={cx('grid size-11 place-items-center rounded-xl', c)}>
              <Icon n={i} />
            </span>
            <div>
              <p className="text-xs text-slate-500">{l}</p>
              <p className="text-lg font-bold">{v}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              {['Invoice', 'Pemesan', 'Metode', 'Nominal', 'Status Bukti / Bayar', 'Bukti Foto', 'Waktu Bayar', ''].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <tr key={b.id} className={cx('hover:bg-blue-50/40 transition', b.pay === 'Bukti Diunggah' && 'bg-purple-50/40')}>
                <td className="px-4 py-3.5 font-medium text-accent">
                  <A to={'/admin/pembayaran/' + b.inv} className="hover:underline">{b.inv}</A>
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-xs text-slate-500">{b.wa}</div>
                </td>
                <td className="px-4 py-3.5">{b.method}</td>
                <td className="px-4 py-3.5 font-semibold">{rp(price(b).total)}</td>
                <td className="px-4 py-3.5">
                  <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold', PAYCHIP[b.pay] || 'bg-slate-100 text-slate-700')}>
                    {b.pay}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {b.paymentProofUrl ? (
                    <A
                      to={'/admin/booking/' + b.inv}
                      className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
                    >
                      <Icon n="card" s={14} /> Lihat Bukti
                    </A>
                  ) : (
                    <span className="text-xs text-slate-400">Belum ada</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-slate-600">{b.paidAt ?? '-'}</td>
                <td className="px-4 py-3.5">
                  <A
                    to={'/admin/pembayaran/' + b.inv}
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-brand hover:bg-brand/10"
                  >
                    Detail<Icon n="chevR" s={16} />
                  </A>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="space-y-3 md:hidden">
        {bookings.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-accent">{b.inv}</p>
                <p className="font-semibold">{b.name}</p>
              </div>
              <span className={cx('h-fit rounded-full px-2.5 py-1 text-xs font-medium', PAYCHIP[b.pay])}>
                {b.pay}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500">{b.method}</span>
              <b>{rp(price(b).total)}</b>
            </div>
            <p className="text-xs text-slate-500 mt-1">Dibayar: {b.paidAt ?? '-'}</p>
            <div className="mt-3">
              <Btn full to={'/admin/pembayaran/' + b.inv}>Detail & Invoice</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Qr() {
  return (
    <svg viewBox="0 0 21 21" className="size-24" shapeRendering="crispEdges">
      {[...Array(21 * 21)].map((_, i) => {
        const x = i % 21, y = Math.floor(i / 21)
        const f = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
        const ring = (a: number, b: number) => {
          const dx = Math.min(a, 6 - a), dy = Math.min(b, 6 - b)
          return Math.min(dx, dy) !== 1 && !(dx === 2 && dy === 2 && false)
        }
        let on = f ? ring(x % 14 > 6 ? x - 14 : x, y % 14 > 6 ? y - 14 : y) : (x * 7 + y * 13 + x * y) % 3 === 0
        return on ? <rect key={i} x={x} y={y} width="1" height="1" fill="#241A24" /> : null
      })}
    </svg>
  )
}

export function Invoice() {
  const { route, get, confirmPayment, toast } = useApp()
  const b: Booking = get(route.id)
  const [detailAddons, setDetailAddons] = useState<BookingAddonItem[] | null>(null)
  const [dlg, setDlg] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch full detail if opened directly or to guarantee fresh addons snapshot
  useEffect(() => {
    if (!b || !b.inv || b.inv === 'CMP-2026-0000') return
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('campose-token') || localStorage.getItem('admin_token') || '') : ''
    let isMounted = true
    fetch(`${BASE_URL}/api/v1/admin/bookings/${b.inv}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((res) => {
        if (isMounted && res.success && res.data?.addons) {
          const items: BookingAddonItem[] = res.data.addons.map((a: any) => ({
            id: a.id || a.addonId,
            name: a.addon?.name || a.name || 'Add-on',
            qty: a.qty || 1,
            price: a.price !== undefined ? a.price : (a.addon?.price || 0),
            total: (a.price !== undefined ? a.price : (a.addon?.price || 0)) * (a.qty || 1),
          }))
          setDetailAddons(items)
        }
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [b.inv])

  const handleManualPaid = async () => {
    setLoading(true)
    await confirmPayment(b.inv, 'Ditandai lunas manual oleh admin')
    setLoading(false)
    setDlg(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const isPaid = b.pay === 'Lunas'

  // Resolve add-on items: prefer fresh detailAddons from direct API, fallback to b.addonItems or b.addons
  const activeAddons: BookingAddonItem[] =
    detailAddons && detailAddons.length > 0
      ? detailAddons
      : b.addonItems && b.addonItems.length > 0
      ? b.addonItems
      : (b.addons || []).map((name) => {
          const unitPrice = ADDONS[name] || 0
          return {
            name,
            qty: 1,
            price: unitPrice,
            total: unitPrice,
          }
        })

  const pkgPrice = b.pkgPrice || PKG[b.pkg] || 1299000
  const addonsSubtotal = activeAddons.reduce((sum, a) => sum + (a.total !== undefined ? a.total : a.price * a.qty), 0)
  const subtotalBeforeDiscount = pkgPrice + addonsSubtotal
  const pr = price(b)
  const discountAmount = b.discount !== undefined ? b.discount : pr.disc
  const finalTotal = b.totalPrice && b.totalPrice > 0 ? b.totalPrice : Math.max(0, subtotalBeforeDiscount - discountAmount)

  return (
    <div className="print-invoice-card-container">
      {/* ── Screen Only: Admin Breadcrumbs, Header, Action Buttons ── */}
      <div data-noprint>
        <Crumbs items={[['Pembayaran', '/admin/pembayaran'], [b.inv]]} />
        <BackLink to="/admin/pembayaran">Kembali ke pembayaran</BackLink>
        <PageHead
          title={`Invoice ${b.inv}`}
          sub="Pratinjau detail transaksi dan instruksi pembayaran"
          actions={
            <>
              <Btn icon="list" to={'/admin/booking/' + b.inv}>Lihat Detail Booking</Btn>
              <Btn icon="download" onClick={handlePrint}>Cetak / Simpan PDF</Btn>
              {!isPaid && (
                <Btn v="primary" icon="check" onClick={() => setDlg(true)}>
                  ACC / Tandai Lunas Manual
                </Btn>
              )}
            </>
          }
        />

        {/* Alert Bukti Bayar */}
        {b.paymentProofUrl && (
          <Card className="mb-5 p-4 bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-purple-600 text-white">
                <Icon n="card" s={20} />
              </span>
              <div>
                <p className="font-bold text-sm text-purple-900">Bukti Pembayaran Tersedia</p>
                <p className="text-xs text-purple-700">Customer telah melampirkan screenshot pembayaran.</p>
              </div>
            </div>
            <Btn v="primary" to={'/admin/booking/' + b.inv}>
              Tinjau di Halaman Booking
            </Btn>
          </Card>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          INVOICE DOCUMENT
          Printed as a standalone A4 formal document.
          On-screen it sits inside the clean admin card container.
         ═══════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-3xl overflow-hidden card bg-white print-invoice-card shadow-lg">
        {/* ── HEADER ──────────────────────────────────────── */}
        <div className="bg-brand text-white px-6 py-6 md:px-10 md:py-8 print-invoice-header">
          <div className="flex items-start justify-between">
            <div>
              <BrandLogo light size={36} />
              <p className="mt-3 text-white/70 text-xs leading-relaxed">
                PT Campose Indonesia<br />
                campose.indonesia@gmail.com<br />
                +62 821-2477-8747
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[.2em] text-white/60">Invoice</p>
              <p className="text-2xl md:text-3xl font-extrabold mt-1">#{b.inv}</p>
              <p className="text-sm text-white/80 mt-2">
                Tanggal: {fd(b.date, { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : b.pay === 'Bukti Diunggah'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <i
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPaid
                        ? 'bg-emerald-500'
                        : b.pay === 'Bukti Diunggah'
                        ? 'bg-purple-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  {b.pay.toUpperCase()}
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
            <p className="font-semibold text-base text-ink">{b.name}</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {b.email}<br />
              {b.wa}
            </p>
          </div>

          {/* Event details */}
          <div>
            <p className="text-[11px] uppercase tracking-[.18em] font-bold text-slate-400 mb-2">
              Detail Acara
            </p>
            <div className="text-sm text-slate-700 space-y-1">
              {b.event && (
                <p className="font-semibold text-ink">{b.event}</p>
              )}
              <p>
                <span className="text-slate-400 inline-block w-16">Tanggal</span>
                {fd(b.date, { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p>
                <span className="text-slate-400 inline-block w-16">Waktu</span>
                {b.start && b.end ? `${b.start} – ${b.end} WIB` : '—'}
              </p>
              <p>
                <span className="text-slate-400 inline-block w-16">Lokasi</span>
                {b.loc || '—'}
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
                    Paket Photobooth {b.pkg} Jam
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Unlimited prints · Custom template frame · Standar props & backdrop
                  </div>
                </td>
                <td className="py-3.5 text-center text-slate-600 font-medium">1</td>
                <td className="py-3.5 text-right text-slate-600 tabular-nums">{rp(pkgPrice)}</td>
                <td className="py-3.5 text-right font-semibold text-slate-900 tabular-nums">{rp(pkgPrice)}</td>
              </tr>

              {/* 2. Add-on Items Rows */}
              {activeAddons.length > 0 && activeAddons.map((item, idx) => (
                <tr key={idx} className="bg-blue-50/20 print:bg-transparent">
                  <td className="py-3 text-ink">
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-brand shrink-0" />
                      <span className="font-medium text-slate-800">{item.name}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-100/70 text-brand px-1.5 py-0.5 rounded border border-blue-200/50 print:border-slate-300">
                        Add-on
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-center text-slate-700 font-medium tabular-nums">{item.qty}</td>
                  <td className="py-3 text-right text-slate-600 tabular-nums">{rp(item.price)}</td>
                  <td className="py-3 text-right font-medium text-slate-900 tabular-nums">{rp(item.total)}</td>
                </tr>
              ))}

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
                <p>• Paket Photobooth: <span className="font-medium text-slate-700">{rp(pkgPrice)}</span></p>
                <p>• Layanan Tambahan (Add-on): <span className="font-medium text-slate-700">{activeAddons.length} item ({rp(addonsSubtotal)})</span></p>
                <p>• Biaya Transportasi: <span className="text-emerald-600 font-medium">Gratis (Jabodetabek)</span></p>
              </div>

              {/* Detailed calculation box */}
              <div className="w-full sm:max-w-xs space-y-2 text-sm bg-slate-50/90 p-4 rounded-xl border border-slate-200/70 print:bg-white print:border-slate-300">
                <div className="flex justify-between text-slate-600">
                  <span>Harga Paket (Base)</span>
                  <span className="font-medium tabular-nums text-slate-800">{rp(pkgPrice)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    Subtotal Add-on
                    {activeAddons.length > 0 && (
                      <span className="text-[11px] font-semibold text-brand">({activeAddons.length})</span>
                    )}
                  </span>
                  <span className="font-medium tabular-nums text-slate-800">{rp(addonsSubtotal)}</span>
                </div>

                <div className="flex justify-between text-slate-700 pt-1.5 border-t border-slate-200">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-semibold tabular-nums text-slate-900">{rp(subtotalBeforeDiscount)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Diskon Voucher ({b.voucher || 'PROMO'})</span>
                    <span className="tabular-nums">-{rp(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t-2 border-brand pt-2.5 mt-2">
                  <span className="text-base font-bold text-ink">Total Akhir</span>
                  <span className="text-xl font-extrabold text-brand tabular-nums">{rp(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PAYMENT INFO ───────────────────────────────── */}
        <div className="mx-6 md:mx-10 border-t border-dashed border-slate-300 py-5">
          <p className="text-[11px] uppercase tracking-[.18em] font-bold text-slate-400 mb-3">
            Instruksi & Metode Pembayaran
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-slate-600">
            <div>
              <p>Metode: <strong className="text-ink">{b.method}</strong></p>
              <p className="mt-1">
                Transfer ke <strong className="text-ink">BCA 123 456 7890</strong> a.n. <strong className="text-ink">PT Campose Indonesia</strong>
              </p>
              {b.paidAt && (
                <p className="mt-2 text-emerald-600 font-semibold text-sm">
                  ✓ Pembayaran diverifikasi pada {b.paidAt}
                </p>
              )}
            </div>
            {b.method === 'QRIS Dinamis' && (
              <div className="shrink-0 p-2 border border-slate-200 rounded-xl bg-white" data-noprint>
                <Qr />
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER — always visible, formal invoice footer ──── */}
        <div className="bg-slate-50 px-6 md:px-10 py-4 text-center text-xs text-slate-400 border-t border-slate-100">
          <p>Invoice ini diterbitkan secara otomatis oleh <strong className="text-slate-500">PT Campose Indonesia</strong></p>
          <p className="mt-0.5">campose.id · campose.indonesia@gmail.com · +62 821-2477-8747</p>
          <p className="mt-0.5">Dokumen ini sah sebagai bukti pemesanan tanpa memerlukan tanda tangan.</p>
        </div>
      </div>

      {/* ── Modal — disembunyikan saat print ── */}
      <div data-noprint>
        <Modal
          open={dlg}
          onClose={() => setDlg(false)}
          title="Tandai Lunas Manual?"
          footer={
            <>
              <Btn full onClick={() => setDlg(false)}>Batal</Btn>
              <Btn v="primary" full loading={loading} onClick={handleManualPaid}>
                Ya, Tandai Lunas
              </Btn>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Booking #{b.inv} akan otomatis dikonfirmasi dan statusnya akan tersinkron ke database secara realtime.
          </p>
        </Modal>
      </div>
    </div>
  )
}
