import { useState } from 'react'
import { PAYCHIP, PKG, ADDONS, price, rp, useApp, Booking, fd, BASE_URL } from './store'
import { A } from './router'
import { BackLink, Btn, Card, Crumbs, Icon, Logo, Modal, PageHead, cx } from './ui'

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
    <svg viewBox="0 0 21 21" className="size-28" shapeRendering="crispEdges">
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
  const pr = price(b)
  const [dlg, setDlg] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleManualPaid = async () => {
    setLoading(true)
    await confirmPayment(b.inv, 'Ditandai lunas manual oleh admin')
    setLoading(false)
    setDlg(false)
  }

  return (
    <div>
      <Crumbs items={[['Pembayaran', '/admin/pembayaran'], [b.inv]]} />
      <BackLink to="/admin/pembayaran">Kembali ke pembayaran</BackLink>
      <PageHead
        title={`Invoice ${b.inv}`}
        sub="Pratinjau detail transaksi dan instruksi pembayaran"
        actions={
          <>
            <Btn icon="list" to={'/admin/booking/' + b.inv}>Lihat Detail Booking</Btn>
            <Btn icon="download" onClick={() => window.print()}>Cetak / Simpan PDF</Btn>
            {b.pay !== 'Lunas' && (
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

      <Card className="mx-auto max-w-2xl overflow-hidden shadow-lg">
        <div className="flex items-center justify-between bg-brand p-5 text-white">
          <Logo admin={false} size={26} />
          <div className="text-right text-xs">
            <p className="font-semibold">{b.inv}</p>
            <p>Terbit {fd(b.date)}</p>
          </div>
        </div>
        <div className="space-y-5 p-5 md:p-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500">Ditagihkan kepada</p>
              <p className="font-semibold text-base">{b.name}</p>
              <p className="text-sm text-slate-600">
                {b.email}
                <br />
                {b.wa}
              </p>
            </div>
            <span className={cx('rounded-full px-3 py-1 text-sm font-semibold', PAYCHIP[b.pay])}>
              {b.pay}
            </span>
          </div>

          <div className="rounded-xl bg-canvas p-4 text-sm">
            <p className="font-semibold">{b.event}</p>
            <p className="text-slate-600">
              {fd(b.date)} · {b.start}–{b.end} · {b.loc}
            </p>
          </div>

          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2">
              <dt>Paket Photobooth {b.pkg} Jam</dt>
              <dd>{rp(PKG[b.pkg] || 0)}</dd>
            </div>
            {b.addons.map((a) => (
              <div key={a} className="flex justify-between py-2">
                <dt>{a}</dt>
                <dd>{rp(ADDONS[a] || 0)}</dd>
              </div>
            ))}
            {b.voucher && (
              <div className="flex justify-between py-2 text-emerald-600 font-semibold">
                <dt>Voucher {b.voucher}</dt>
                <dd>-{rp(pr.disc)}</dd>
              </div>
            )}
            <div className="flex justify-between py-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-brand text-lg">{rp(pr.total)}</dd>
            </div>
          </dl>

          <div className="flex items-center gap-5 border-t border-dashed border-slate-300 pt-5">
            {b.method === 'QRIS Dinamis' ? (
              <Qr />
            ) : (
              <Icon n="card" s={56} className="text-brand shrink-0" />
            )}
            <div className="text-sm">
              <p className="font-semibold">{b.method}</p>
              <p className="text-slate-600">
                Transfer ke BCA 123 456 7890 a.n. PT Campose Indonesia.
              </p>
              {b.paidAt && <p className="mt-1 text-emerald-600 font-medium">Dibayar pada {b.paidAt}</p>}
            </div>
          </div>
        </div>
      </Card>

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
  )
}
