import { useEffect, useState } from 'react'
import { Aperture } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { WA } from '@/data/config'
import { FlowSteps } from '@/features/booking/FlowSteps'
import { Booking, resolved, useBooking, useCountdown } from '@/features/booking/booking-state'
import { fmt } from '@/lib/format'
import { col } from '@/lib/image'
import { Link } from '@/lib/router'
import { VoucherBox } from '@/pages/booking/DetailPage'

function QR() {
  const N = 25
  const cells: [number, number][] = []
  let s = 7
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  const fin = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!fin(x, y) && rnd() > 0.5) cells.push([x, y])
  const Finder = ({ x, y }: { x: number; y: number }) => <g transform={`translate(${x} ${y})`}><rect width="7" height="7" fill="#241A24" /><rect x="1" y="1" width="5" height="5" fill="#fff" /><rect x="2" y="2" width="3" height="3" fill="#241A24" /></g>
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} width="100%" style={{ maxWidth: 280, display: 'block', margin: '0 auto' }} shapeRendering="crispEdges" role="img" aria-label="Kode QRIS dummy">
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#fff" />
      {cells.map(([x, y]) => <rect key={x + '-' + y} x={x} y={y} width="1" height="1" fill="#241A24" />)}
      <Finder x={0} y={0} /><Finder x={N - 7} y={0} /><Finder x={0} y={N - 7} />
      <rect x={N / 2 - 2.5} y={N / 2 - 2.5} width="5" height="5" fill="#fff" /><rect x={N / 2 - 2} y={N / 2 - 2} width="4" height="4" rx="1" fill="#1A76D2" />
    </svg>
  )
}
const BANKS = [['BCA', '8277 0821 2477 8747', '#0060AF'], ['BNI', '9881 0821 2477 8747', '#F15A22'], ['BRI', '8881 0821 2477 8747', '#00529C'], ['Mandiri', '8908 0821 2477 8747', '#003D79']]
export function PaymentPage() {
  const { b } = useBooking()
  const r = resolved(b)
  const [tab, setTab] = useState<'qris' | 'va'>('qris')
  const [paid, setPaid] = useState(false)
  const [toast, setToast] = useState('')
  const cd = useCountdown(14 * 60 + 59)
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2000); return () => clearTimeout(t) } }, [toast])
  const copy = (v: string, l: string) => { navigator.clipboard?.writeText(v.replace(/\s/g, '')); setToast(`Nomor VA ${l} disalin`) }
  if (paid) return (
    <section className="silk-light py-8 md:py-12 md:min-h-[900px]"><div className="max-w-[1280px] mx-auto px-5 md:px-8"><FlowSteps step={4} />
      <div className="pop mt-8 md:mt-10 max-w-[720px] mx-auto card p-6 md:p-12 text-center">
        <span className="w-24 h-24 rounded-full bg-[#e3f7ec] text-[#1fa463] grid place-items-center mx-auto"><Icon n="check" s={48} /></span>
        <h1 className="mt-6 text-[28px] md:text-4xl font-extrabold uppercase">Pembayaran <span className="text-royal">Berhasil</span></h1>
        <p className="mt-3 text-ink/70">Terima kasih, {r.nama.split(' ')[0]}! Booking kamu sudah dikonfirmasi. Detail dikirim ke {r.email}.</p>
        <div className="mt-8 ticket bg-[#f6faff] rounded-2xl p-5 md:p-6 text-left grid grid-cols-1 md:grid-cols-2 gap-y-1 md:gap-y-3 text-sm break-words">
          <span className="text-ink/55">Invoice</span><b className="md:text-right mb-2 md:mb-0">#CMP-0001 · LUNAS</b>
          <span className="text-ink/55">Paket</span><b className="md:text-right mb-2 md:mb-0">Photobooth {r.pkg.title}</b>
          <span className="text-ink/55">Jadwal</span><b className="md:text-right mb-2 md:mb-0">{r.date}, {r.range}</b>
          <span className="text-ink/55">Lokasi</span><b className="md:text-right mb-2 md:mb-0">{r.lokasi}</b>
          <span className="text-ink/55">Total dibayar</span><b className="md:text-right text-royal mb-2 md:mb-0">{fmt(r.total)}</b>
        </div>
        <div className="mt-8 flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
          <button onClick={() => setToast('Event ditambahkan ke kalender (simulasi)')} className="btn btn-primary !h-14"><Icon n="cal" s={18} /> Tambah ke Kalender</button>
          <a href={WA} target="_blank" className="btn btn-outline !h-14"><Icon n="chat" s={18} /> Chat WhatsApp</a>
        </div>
        <Link to="/" className="inline-block mt-6 text-sm text-brand font-medium underline">Kembali ke Beranda</Link>
      </div>
      {toast && <div className="pop fixed top-24 left-1/2 -translate-x-1/2 bg-brand text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 text-center w-max max-w-[90vw]">{toast}</div>}
    </div></section>
  )
  return (
    <section className="silk-light py-8 md:py-12 md:min-h-[900px]"><div className="max-w-[1280px] mx-auto px-5 md:px-8"><FlowSteps step={3} />
      <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 md:gap-8 items-start max-w-[1100px] mx-auto">
        <div className="card p-5 md:p-8">
          <h1 className="text-[28px] md:text-3xl font-extrabold uppercase">Pilih <span className="text-royal">Metode Bayar</span></h1>
          <div className="mt-6 grid grid-cols-2 gap-3 p-1.5 rounded-full bg-[#eaf3fc]">
            {([['qris', 'QRIS Dinamis'], ['va', 'Transfer Bank / VA']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`h-12 rounded-full font-semibold text-[13px] md:text-sm transition ${tab === k ? 'bg-brand text-white shadow' : 'text-ink/70'}`}>{l}</button>)}
          </div>
          {tab === 'qris' ? (
            <div className="pop mt-6 md:mt-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center text-center md:text-left">
              <div className="p-3 md:p-4 rounded-3xl border-2 border-[#d6e4f5] relative w-full max-w-[300px] md:w-auto"><QR /><span className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-white grid place-items-center text-brand"><Aperture size={30} /></span></div>
              <div>
                <p className="text-sm text-ink/60">Nominal pembayaran</p>
                <p className="text-4xl font-extrabold text-royal">{fmt(r.total)}</p>
                <p className="mt-5 text-sm text-ink/60">QR berlaku</p>
                <p className="text-3xl font-extrabold tabular-nums">{cd.text}</p>
                <ol className="mt-5 text-sm text-ink/70 space-y-1 list-decimal list-inside text-left"><li>Buka aplikasi e-wallet / m-banking</li><li>Scan kode QRIS</li><li>Konfirmasi pembayaran</li></ol>
              </div>
            </div>
          ) : (
            <div className="pop mt-8 space-y-3">
              {BANKS.map(([n, no, c]) => (
                <div key={n} className="flex flex-wrap items-center gap-3 md:gap-4 rounded-2xl border border-[#d6e4f5] p-4 hover:border-brand transition">
                  <span className="w-16 h-12 rounded-xl grid place-items-center text-white font-extrabold text-sm" style={{ background: c }}>{n}</span>
                  <div className="flex-1 min-w-0"><div className="text-xs text-ink/55">Virtual Account {n}</div><div className="text-lg md:text-xl font-bold tracking-wider tabular-nums">{no}</div></div>
                  <button onClick={() => copy(no, n)} className="btn btn-outline !h-12 md:!h-10 !px-4 !text-sm"><Icon n="copy" s={16} /> Salin Nomor VA</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <aside className="card p-5 md:p-7 md:sticky md:top-28">
          <span className="inline-flex items-center gap-2 bg-[#FFF4D6] text-[#9a6700] text-sm font-semibold px-4 py-2 rounded-full"><i className="w-2 h-2 rounded-full bg-[#f5a524] animate-pulse" />Menunggu Pembayaran</span>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink/55">Invoice</dt><dd className="font-semibold">#CMP-0001</dd></div>
            <div className="flex justify-between"><dt className="text-ink/55">Paket</dt><dd className="font-semibold">Photobooth {r.pkg.title}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/55">Jadwal</dt><dd className="font-semibold text-right">{r.date}<br />{r.range}</dd></div>
          </dl>
          <div className="my-5 border-t-2 border-dashed border-[#d6e4f5]" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink/55">Harga Paket</dt><dd className="font-semibold">{fmt(r.pkg.price)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/55">Total Add On</dt><dd className="font-semibold">{fmt(r.addonTotal)}</dd></div>
            {r.discount > 0 && <div className="flex justify-between text-[#16a34a] font-semibold"><dt>Diskon Voucher</dt><dd>-{fmt(r.discount)}</dd></div>}
          </dl>
          <div className="mt-5"><VoucherBox /></div>
          <div className="mt-5 pt-4 border-t-2 border-dashed border-[#d6e4f5] flex justify-between items-end"><span className="font-extrabold uppercase tracking-wider text-sm">Total Harga</span><span className="text-2xl font-extrabold text-royal">{fmt(r.total)}</span></div>
          <button onClick={() => setPaid(true)} className="btn btn-primary w-full mt-6 !h-14">Saya Sudah Bayar</button>
          <p className="mt-3 text-xs text-center text-ink/50">Prototipe: tombol ini mensimulasikan pembayaran berhasil.</p>
        </aside>
      </div>
      {toast && <div className="pop fixed top-24 left-1/2 -translate-x-1/2 bg-brand text-white px-6 py-3 rounded-full text-sm shadow-xl z-50 text-center w-max max-w-[90vw]">{toast}</div>}
    </div></section>
  )
}
