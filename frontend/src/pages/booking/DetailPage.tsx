import type React from 'react'
import { useState, useId, type ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import { ADDONS, FEATURES, PACKAGES, VOUCHERS } from '@/data/catalog'
import { DStatus, SLOTS, dateStatus, slotOff } from '@/data/schedule'
import { FlowSteps } from '@/features/booking/FlowSteps'
import { Booking, demoBooking, resolved, useBooking } from '@/features/booking/booking-state'
import { DAYS, MONTHS, dateLabel, endTime, fmt } from '@/lib/format'
import { col, occ } from '@/lib/image'
import { Link, navigate } from '@/lib/router'

const STAT: Record<DStatus, { l: string; cls: string }> = {
  tersedia: { l: 'Tersedia', cls: 'bg-[#e6f2ff] text-brand hover:bg-brand hover:text-white' },
  penuh: { l: 'Penuh', cls: 'bg-[#ffe3e3] text-coral line-through cursor-not-allowed' },
  dibooking: { l: 'Sudah dibooking', cls: 'bg-[#eceef2] text-[#9aa0ab] cursor-not-allowed' },
}
export function VoucherBox() {
  const { b, set } = useBooking()
  const id = useId()
  const [code, setCode] = useState('')
  const [err, setErr] = useState(false)
  const apply = () => { if (VOUCHERS[code.trim().toUpperCase()]) { set({ voucher: code.trim().toUpperCase() }); setErr(false); setCode('') } else setErr(true) }
  if (b.voucher) return (
    <div className="pop flex items-center justify-between gap-3 rounded-2xl bg-[#e3f7ec] border border-[#9fdcb9] px-4 py-3 flex-wrap">
      <span className="flex items-start gap-2 text-sm font-semibold text-[#14803c]"><Icon n="check" s={18} /> Voucher berhasil dipakai - Diskon {fmt(VOUCHERS[b.voucher])}</span>
      <button onClick={() => set({ voucher: '' })} className="text-sm font-semibold text-[#14803c] underline">Hapus</button>
    </div>
  )
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={id}>Punya kode voucher?</label>
      <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
        <input id={id} value={code} onChange={(e) => { setCode(e.target.value); setErr(false) }} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="Masukkan kode" className={`field !h-12 uppercase ${err ? '!border-coral' : ''}`} />
        <button onClick={apply} className="btn btn-primary !h-12">Terapkan</button>
      </div>
      {err ? <p className="mt-2 text-xs text-coral font-medium">Kode voucher tidak valid atau sudah kedaluwarsa.</p> : <p className="mt-2 text-xs text-ink/45">Contoh kode: CAMPOSE10</p>}
    </div>
  )
}
const TNC = [
  'Pemesanan dianggap sah setelah pembayaran DP dikonfirmasi.',
  'Reschedule maksimal 1x dan diajukan paling lambat H-3 sebelum acara, selebihnya dikenakan biaya.',
  'Waktu layanan dihitung sejak photobooth siap digunakan di lokasi.',
  'Keterlambatan akses lokasi akan mengurangi durasi layanan.',
  'Pelunasan dilakukan sesuai batas waktu yang tertera di invoice.',
  'Dengan melakukan pembayaran, pemesan dianggap telah menyetujui seluruh syarat dan ketentuan yang berlaku.',
]
const Section = ({ n, t, children }: { n: number; t: string; children: React.ReactNode }) => (
  <section className="card p-5 lg:p-9">
    <h2 className="flex items-center gap-4 text-xl lg:text-2xl font-bold pb-5 border-b-2 border-brand/25">
      <span className="w-11 h-11 rounded-full bg-brand text-white grid place-items-center shrink-0">{n}</span>{t}
    </h2>
    <div className="mt-7">{children}</div>
  </section>
)
const Req = () => <span className="text-coral font-bold" aria-hidden> *</span>
const L = ({ t, req, children }: { t: string; req?: boolean; children: React.ReactNode }) => <label className="block text-sm font-medium">{t}{req && <Req />}<div className="mt-1.5">{children}</div></label>

export function DetailPage() {
  const { b, set } = useBooking()
  const p = PACKAGES[b.pkg]
  const [slide, setSlide] = useState(0)
  const [sheet, setSheet] = useState(false)
  const first = new Date(2026, b.month - 1, 1).getDay()
  const offset = (first + 6) % 7
  const dim = new Date(2026, b.month, 0).getDate()
  const r = resolved(b)
  const ready = b.day && b.time && b.lokasi && b.acara && b.first && b.email && b.wa
  const toggle = (i: number) => set({ addons: b.addons.includes(i) ? b.addons.filter((x) => x !== i) : [...b.addons, i] })
  const missing = [!b.day && 'tanggal', !b.time && 'jam', !(b.acara && b.lokasi) && 'detail event', !(b.first && b.email && b.wa) && 'identitas', !b.agree && 'persetujuan S&K'].filter(Boolean).join(', ')
  return (
    <section className="silk-light py-8 md:py-12 pb-32 md:pb-12">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-0">
        <FlowSteps step={1} />
        <Link to="/booking-photobooth" className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-brand"><Icon n="left" s={16} /> Ganti paket</Link>

        {/* paket */}
        <div className="mt-4 card overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          <div className="relative">
            <div key={slide} className="pop grayscale h-full min-h-[240px] md:min-h-[300px]" style={{ ...occ(slide), aspectRatio: 'auto' }} />
            <button aria-label="Foto sebelumnya" onClick={() => setSlide((slide + 2) % 3)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 grid place-items-center"><Icon n="left" /></button>
            <button aria-label="Foto berikutnya" onClick={() => setSlide((slide + 1) % 3)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 grid place-items-center"><Icon n="right" /></button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">{[0, 1, 2].map((i) => <span key={i} className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} />)}</div>
          </div>
          <div className="p-5 md:p-8 lg:p-10">
            <span className="inline-block px-4 py-1 rounded-lg font-extrabold border-[3px]" style={{ borderColor: p.color }}>{p.title}</span>
            <h1 className="mt-4 text-3xl font-extrabold uppercase">Paket Photobooth {p.title}</h1>
            <div className="mt-2 text-3xl md:text-4xl font-extrabold text-royal">{fmt(p.price)}</div>
            <ul className="mt-6 space-y-4">
              {FEATURES.map((f) => <li key={f.t} className="flex gap-3 text-sm"><Icon n="check" s={18} className="text-brand mt-0.5 shrink-0" /><span><b>{f.t}</b><br /><span className="text-ink/65">{f.d}</span></span></li>)}
            </ul>
          </div>
        </div>

        {/* form lebar penuh */}
        <div className="mt-8 md:mt-10 space-y-6 md:space-y-8">
          <p className="text-sm text-ink/70"><span className="text-coral font-bold">*</span> wajib diisi</p>
          <Section n={1} t="Pilih Tanggal & Jam">
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 lg:gap-10">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl">{MONTHS[b.month]} 2026</h3>
                  <div className="flex gap-2">
                    <button aria-label="Bulan sebelumnya" disabled={b.month === 7} onClick={() => set({ month: 7, day: null, time: null })} className="w-11 h-11 rounded-full border border-[#d6e4f5] grid place-items-center disabled:opacity-30"><Icon n="left" s={18} /></button>
                    <button aria-label="Bulan berikutnya" disabled={b.month === 8} onClick={() => set({ month: 8, day: null, time: null })} className="w-11 h-11 rounded-full border border-[#d6e4f5] grid place-items-center disabled:opacity-30"><Icon n="right" s={18} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-ink/50 mb-2">{[1, 2, 3, 4, 5, 6, 0].map((d) => <div key={d}>{DAYS[d].slice(0, 3)}</div>)}</div>
                <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                  {Array.from({ length: offset }).map((_, i) => <div key={'e' + i} />)}
                  {Array.from({ length: dim }).map((_, i) => {
                    const d = i + 1, st = dateStatus(b.month, d), on = b.day === d
                    return <button key={d} disabled={st !== 'tersedia'} onClick={() => set({ day: d, time: null })} title={STAT[st].l} aria-pressed={on}
                      className={`h-11 md:h-14 rounded-xl text-sm md:text-base font-semibold transition ${on ? '!bg-brand !text-white ring-4 ring-brand/30' : STAT[st].cls}`}>{d}</button>
                  })}
                </div>
                <div className="mt-5 flex flex-wrap gap-5 text-xs text-ink/70">
                  {(Object.keys(STAT) as DStatus[]).map((k) => <span key={k} className="flex items-center gap-2"><i className={`w-3 h-3 rounded ${k === 'tersedia' ? 'bg-brand' : k === 'penuh' ? 'bg-coral' : 'bg-[#c3c7d0]'}`} />{STAT[k].l}</span>)}
                </div>
              </div>
              <div className="rounded-2xl bg-[#f6faff] p-4 md:p-6">
                <h3 className="font-bold text-lg">Jam Tersedia</h3>
                <div className="mt-3 rounded-xl bg-white border border-[#d6e4f5] p-4 text-sm">
                  <div className="flex items-center gap-2 text-ink/60"><Icon n="cal" s={16} /> Tanggal terpilih<Req /></div>
                  <div className="font-semibold mt-0.5">{b.day ? dateLabel(b.month, b.day) : 'Belum dipilih'}</div>
                  <div className="flex items-center gap-2 text-ink/60 mt-3"><Icon n="clock" s={16} /> Jam terpilih<Req /></div>
                  <div className="font-semibold mt-0.5">{b.time ? `${b.time} – ${endTime(b.time, p.hours)} WIB (${p.hours} jam)` : 'Belum dipilih'}</div>
                </div>
                {b.day ? (
                  <div className="pop mt-5 grid grid-cols-3 gap-3">
                    {SLOTS.map((s, i) => <button key={s} className="chip !px-0" data-on={b.time === s} disabled={slotOff(b.day!, i)} onClick={() => set({ time: s })}>{s}</button>)}
                  </div>
                ) : <p className="mt-5 text-sm text-ink/55">Pilih tanggal di kalender untuk melihat jam yang tersedia.</p>}
                <p className="mt-4 text-xs text-ink/55">Jam berwarna abu-abu sudah terisi.</p>
              </div>
            </div>
          </Section>

          <Section n={2} t="Detail Event">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <L t="Nama Acara" req><input className="field" placeholder="cth: Pernikahan Nadia & Raka" value={b.acara} onChange={(e) => set({ acara: e.target.value })} /></L>
              <L t="Jenis Acara">
                <select className="field" value={b.jenis} onChange={(e) => set({ jenis: e.target.value })}>
                  <option value="">Pilih jenis acara</option>
                  {['Wedding', 'Corporate', 'Campus', 'School', 'Birthday', 'Festival', 'Lainnya'].map((j) => <option key={j}>{j}</option>)}
                </select>
              </L>
              <div className="md:col-span-2"><L t="Lokasi / Alamat Event" req><input className="field" placeholder="Nama venue, alamat lengkap, kota" value={b.lokasi} onChange={(e) => set({ lokasi: e.target.value })} /></L></div>
              <L t="Perkiraan Jumlah Tamu"><input type="number" min={1} className="field" placeholder="cth: 200" value={b.tamu} onChange={(e) => set({ tamu: e.target.value })} /></L>
              <L t="Catatan"><textarea rows={1} className="field" placeholder="Tema, jam setup, kebutuhan khusus…" value={b.catatan} onChange={(e) => set({ catatan: e.target.value })} /></L>
            </div>
          </Section>

          <Section n={3} t="Identitas Pemesan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <L t="Nama Depan" req><input className="field" value={b.first} onChange={(e) => set({ first: e.target.value })} /></L>
              <L t="Nama Belakang"><input className="field" value={b.last} onChange={(e) => set({ last: e.target.value })} /></L>
              <L t="Email" req><input type="email" className="field" value={b.email} onChange={(e) => set({ email: e.target.value })} /></L>
              <L t="Nomor WhatsApp" req><input className="field" placeholder="+62" value={b.wa} onChange={(e) => set({ wa: e.target.value })} /></L>
              <div className="md:col-span-2"><L t="Nama Instansi / Organisasi (opsional)"><input className="field" value={b.instansi} onChange={(e) => set({ instansi: e.target.value })} /></L></div>
            </div>
          </Section>

          <Section n={4} t="Pilih Add On & Booking">
            <div className="grid md:grid-cols-2 gap-3">
              {ADDONS.map(([n, pr], i) => {
                const on = b.addons.includes(i), per = n.includes('(per'), q = b.qty[i] ?? 1
                return (
                  <div key={n} className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 transition ${on ? 'border-brand bg-[#eef5fd]' : 'border-[#d6e4f5] bg-white hover:border-brand/60'}`}>
                    <label className="flex items-center gap-4 flex-1 cursor-pointer">
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(i)} />
                      <span className={`w-6 h-6 rounded-md grid place-items-center border-2 shrink-0 ${on ? 'bg-brand border-brand text-white' : 'border-[#b8cbe3] bg-white'}`}>{on && <Icon n="check" s={14} />}</span>
                      <span className="flex-1 font-medium text-sm leading-snug">{n}<span className="block font-bold text-royal">{fmt(pr)}</span></span>
                    </label>
                    {on && per && (
                      <span className="flex items-center gap-2" aria-label="Jumlah">
                        <button aria-label="Kurangi" onClick={() => set({ qty: { ...b.qty, [i]: Math.max(1, q - 1) } })} className="w-8 h-8 rounded-full border border-brand text-brand grid place-items-center"><Icon n="minus" s={14} /></button>
                        <b className="w-5 text-center">{q}</b>
                        <button aria-label="Tambah" onClick={() => set({ qty: { ...b.qty, [i]: q + 1 } })} className="w-8 h-8 rounded-full bg-brand text-white grid place-items-center"><Icon n="plus" s={14} /></button>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="hidden md:block mt-8 rounded-2xl bg-[#F3F6FB] p-7">
              <h3 className="eyebrow mb-4">Ringkasan Pesanan</h3>
              <div className="flex justify-between py-2 text-sm"><span className="text-ink/60">Harga Paket Photobooth {p.title}</span><b>{fmt(p.price)}</b></div>
              <div className="flex justify-between py-2 text-sm"><span className="text-ink/60">Total Add On ({b.addons.length})</span><b>{fmt(r.addonTotal)}</b></div>
              {r.discount > 0 && <div className="flex justify-between py-2 text-sm text-[#16a34a] font-semibold"><span>Diskon Voucher ({r.voucher})</span><b>-{fmt(r.discount)}</b></div>}
              <div className="mt-4"><VoucherBox /></div>
              <div className="mt-4 pt-4 border-t-2 border-dashed border-[#bcd5f2] flex justify-between items-end"><span className="font-extrabold uppercase tracking-wider">Total Harga</span><span className="text-4xl font-extrabold text-royal">{fmt(r.total)}</span></div>
            </div>

            <div className="mt-8 rounded-2xl bg-white border border-[#e3edf9] border-t-[6px] border-t-brand shadow-sm p-5 md:p-7 lg:p-9">
              <h3 className="text-center text-xl font-extrabold uppercase tracking-[.14em]">Syarat dan Ketentuan</h3>
              <p className="text-center text-xs text-ink/45 mt-1">Dapat diedit oleh admin</p>
              <hr className="my-5 border-[#e3edf9]" />
              <ol className="space-y-3 text-sm leading-relaxed text-ink/80 list-decimal list-outside pl-5 marker:font-bold marker:text-brand">
                {TNC.map((t) => <li key={t} className="pl-2">{t}</li>)}
              </ol>
            </div>

            <label className="mt-6 flex items-center gap-3 cursor-pointer font-medium">
              <input type="checkbox" className="sr-only" checked={b.agree} onChange={(e) => set({ agree: e.target.checked })} />
              <span className={`w-6 h-6 rounded-md grid place-items-center border-2 shrink-0 ${b.agree ? 'bg-brand border-brand text-white' : 'border-[#b8cbe3] bg-white'}`}>{b.agree && <Icon n="check" s={14} />}</span>
              Saya menyetujui syarat dan ketentuan yang berlaku
            </label>
            <button disabled={!ready || !b.agree} onClick={() => navigate('/invoice')} className="hidden md:flex btn btn-primary w-full mt-6 !h-16 text-lg">Booking Sekarang</button>
            {(!ready || !b.agree) && <p className="hidden md:block mt-3 text-xs text-ink/55 text-center">Lengkapi: {missing}.</p>}
            <button onClick={() => set({ ...demoBooking, agree: true })} className="mt-2 w-full text-xs text-brand font-medium underline">Isi data contoh</button>
          </Section>
        </div>
      </div>
      {/* mobile: sticky summary bar + bottom sheet */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#d6e4f5] shadow-[0_-10px_30px_-12px_rgba(26,118,210,.35)] px-4 pt-3 pb-4">
        <button onClick={() => setSheet(true)} className="w-full flex items-center justify-between text-left min-h-[44px]" aria-label="Lihat rincian pesanan">
          <span><span className="block text-xs text-ink/55">Total Harga · lihat rincian</span><span className="text-xl font-extrabold text-royal">{fmt(r.total)}</span></span>
          <span className="w-9 h-9 rounded-full bg-[#e6f2ff] text-brand grid place-items-center"><Icon n="down" s={18} className="rotate-180" /></span>
        </button>
        <button onClick={() => (ready && b.agree ? navigate('/invoice') : setSheet(true))} className={`btn btn-primary mt-2 !h-12 ${ready && b.agree ? '' : 'opacity-70'}`}>Booking Sekarang</button>
      </div>
      {sheet && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setSheet(false)}>
          <div className="pop w-full max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-extrabold uppercase tracking-wide">Ringkasan Pesanan</h3><button aria-label="Tutup" onClick={() => setSheet(false)} className="w-10 h-10 grid place-items-center rounded-full bg-[#F3F6FB]"><Icon n="x" s={18} /></button></div>
            <dl className="mt-4 space-y-3 text-sm">
              {[['Paket', `Photobooth ${p.title}`], ['Tanggal', b.day ? dateLabel(b.month, b.day) : '—'], ['Jam', b.time ? `${b.time} – ${endTime(b.time, p.hours)} WIB` : '—'], ['Lokasi', b.lokasi || '—']].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-ink/55">{k}</dt><dd className="font-semibold text-right break-words min-w-0">{v}</dd></div>
              ))}
            </dl>
            <div className="my-4 border-t-2 border-dashed border-[#d6e4f5]" />
            <div className="flex justify-between text-sm py-1"><span className="text-ink/60">Harga Paket</span><b>{fmt(p.price)}</b></div>
            <div className="flex justify-between text-sm py-1"><span className="text-ink/60">Total Add On ({b.addons.length})</span><b>{fmt(r.addonTotal)}</b></div>
            {r.discount > 0 && <div className="flex justify-between text-sm py-1 text-[#16a34a] font-semibold"><span>Diskon Voucher ({r.voucher})</span><b>-{fmt(r.discount)}</b></div>}
            <div className="mt-4"><VoucherBox /></div>
            <div className="mt-4 pt-4 border-t-2 border-dashed border-[#d6e4f5] flex justify-between items-end"><span className="font-extrabold uppercase text-sm tracking-wider">Total Harga</span><span className="text-3xl font-extrabold text-royal">{fmt(r.total)}</span></div>
            {(!ready || !b.agree) && <p className="mt-4 text-xs text-coral font-medium">Lengkapi dulu: {missing}.</p>}
            <button disabled={!ready || !b.agree} onClick={() => navigate('/invoice')} className="btn btn-primary mt-4 !h-12">Booking Sekarang</button>
          </div>
        </div>
      )}
    </section>
  )
}
