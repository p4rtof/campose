import { useState } from 'react'
import { Logo, SilkWaves } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { GFORM, WA } from '@/data/config'
import { Booking } from '@/features/booking/booking-state'
import { col } from '@/lib/image'
import { Link } from '@/lib/router'

const TILES = [
  { c: 'Wedding', n: 'Pernikahan Sinta & Bayu', l: 'Bandung', y: 2026, r: [0, 0, 265, 217] },
  { c: 'Campus', n: 'Gathering Kampus', l: 'IPB University, Bogor', y: 2026, r: [330, 440, 170, 211] },
  { c: 'Corporate', n: 'Brand Activation Launching', l: 'Jakarta Selatan', y: 2026, r: [580, 0, 315, 217] },
  { c: 'School', n: 'Perpisahan Kelas XII', l: 'SMAN 3 Depok', y: 2025, r: [0, 217, 305, 223] },
  { c: 'Birthday', n: 'Sweet Seventeen Alya', l: 'Tangerang', y: 2026, r: [895, 0, 281, 217] },
  { c: 'Festival', n: 'Festival Budaya Nusantara', l: 'Yogyakarta', y: 2025, r: [903, 440, 273, 211] },
  { c: 'Corporate', n: 'Company Gathering', l: 'Jakarta Pusat', y: 2026, r: [870, 217, 306, 223] },
  { c: 'School', n: 'Pelantikan Pramuka', l: 'SMPN 1 Bogor', y: 2025, r: [578, 440, 325, 211] },
  { c: 'Wedding', n: 'Resepsi Nadia & Raka', l: 'Jakarta Selatan', y: 2026, r: [265, 0, 315, 217] },
  { c: 'Campus', n: 'Wisuda Fakultas', l: 'Universitas Indonesia, Depok', y: 2025, r: [0, 440, 273, 211] },
  { c: 'Birthday', n: 'Ulang Tahun Ke-30 Dimas', l: 'Bekasi', y: 2026, r: [930, 217, 170, 223] },
  { c: 'Festival', n: 'Pensi Sekolah', l: 'Bandung', y: 2026, r: [273, 440, 305, 211] },
]
const CATS = ['Semua', 'Wedding', 'Corporate', 'Campus', 'School', 'Birthday', 'Festival']
const OCC = [
  ['heart', 'Pernikahan', 'Abadikan hari bahagia bersama semua tamu.'], ['users', 'Acara Keluarga', 'Foto bareng keluarga besar, tanpa antre.'],
  ['gift', 'Perayaan Privat', 'Syukuran, lamaran, dan pesta kecil.'], ['book', 'Sekolah & Reuni', 'Wisuda, class meeting, hingga reuni akbar.'],
  ['case', 'Corporate & Brand Activation', 'Booth bermerek untuk branding acara.'], ['music', 'Festival', 'Antrean ramai tetap lancar, cetak instan.'],
  ['star', 'Ulang Tahun', 'Props seru untuk pesta yang tak terlupakan.'], ['award', 'Acara Kampus', 'Dies natalis, orientasi, dan konser kampus.'],
]
const REVIEWS = [
  ['Rina Anggraini', 'Booth-nya seru banget! Tamu pernikahan kami antre terus dan hasil cetaknya bagus.'],
  ['Dimas Pratama', 'Tim ramah dan on time. Template sesuai brand kantor, hasilnya rapi.'],
  ['Salsabila N.', 'Dipakai untuk wisuda sekolah, anak-anak happy. Props-nya lucu dan banyak.'],
  ['Kevin Hartono', 'Proses booking gampang, invoice jelas. Pasti pakai Campose lagi.'],
  ['Putri Maharani', 'Foto hitam putihnya estetik! Banyak tamu minta kontak Campose.'],
  ['Fajar Nugroho', 'Cocok untuk festival kampus, cetak cepat walau antrean panjang.'],
]
export function Stars({ n = 5 }: { n?: number }) {
  return <span className="inline-flex gap-0.5 text-[#FBBC04]">{Array.from({ length: n }).map((_, i) => <Icon key={i} n="star" s={16} fill />)}</span>
}

export function HomePage() {
  const [cat, setCat] = useState('Semua')
  const [ri, setRi] = useState(0)
  const [sel, setSel] = useState<(typeof TILES)[number] | null>(null)
  const shown = TILES.filter((t) => cat === 'Semua' || t.c === cat)
  const rv = [0, 1, 2].map((k) => REVIEWS[(ri + k) % REVIEWS.length])
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#1A76D2 0%,#1665b8 60%,#1F4FBF 100%)' }}>
        <SilkWaves dark />
        <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 pt-10 pb-12 md:pt-20 md:pb-28 grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8 md:gap-12 items-center">
          <div>
            <div className="hidden md:block"><Logo light size={64} /></div>
            <p className="md:hidden text-xs font-bold uppercase tracking-[.2em] text-white/80">Event Photobooth Rental</p>
            <h1 className="mt-3 md:mt-10 text-[32px] md:text-[76px] leading-[1.1] md:leading-[1.02] font-extrabold uppercase">Event<br />Memories</h1>
            <p className="mt-4 md:mt-6 text-base md:text-xl text-white/90 max-w-lg font-light leading-relaxed">Photobooth sewa untuk pernikahan, kampus, kantor, dan festival. Cetak foto tanpa batas, kenangan digital langsung di tanganmu.</p>
            <div className="mt-7 md:mt-10 flex flex-col md:flex-row gap-3 md:gap-4">
              <Link to="/booking-photobooth" className="btn btn-white !h-14 !px-8 text-base">Booking Photobooth</Link>
              <a href="#portfolio" onClick={(e) => { e.preventDefault(); document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' }) }} className="btn btn-ghost-white !h-14 !px-8 text-base">Lihat Portfolio</a>
            </div>
          </div>
          <div className="md:hidden grid grid-cols-2 gap-3">
            {[[0, 0, 265, 217], [265, 0, 315, 217], [0, 217, 305, 223], [870, 217, 306, 223]].map((r, i) => <div key={i} className="rounded-2xl overflow-hidden grayscale border-2 border-white/60" style={{ ...col(r[0], r[1], r[2], r[3]), aspectRatio: '1 / 1' }} />)}
          </div>
          <div className="relative h-[520px] hidden md:block">
            <div className="absolute right-4 top-0 w-[330px] rotate-[4deg] bg-white p-3 pb-12 rounded-2xl shadow-2xl ticket">
              <div className="rounded-xl overflow-hidden" style={{ ...col(0, 20, 470, 631), aspectRatio: '470/631', backgroundSize: '250% auto' , backgroundPosition: '0% 40%' }} />
              <div className="absolute bottom-3 left-0 right-0 text-center text-ink text-xs font-bold tracking-[.2em] uppercase">Campose · 2026</div>
            </div>
            <div className="absolute left-0 bottom-0 w-[230px] -rotate-[6deg] bg-white p-2 rounded-xl shadow-2xl"><div className="rounded-lg overflow-hidden" style={col(0, 217, 305, 223)} /></div>
            <div className="absolute left-20 top-6 -rotate-[10deg] bg-white text-brand px-5 py-3 rounded-full font-semibold text-sm shadow-xl">Unlimited print</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 md:py-24 silk-light">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <div className="relative rounded-2xl md:rounded-[28px] overflow-hidden shadow-2xl [container-type:inline-size]">
            <img src="/assets/collage.png" alt="Kolase foto grup hitam putih dari berbagai event Campose" className="w-full block" />
            <div className="absolute bg-white grid place-items-center text-center" style={{ left: '26.1%', width: '47.8%', top: '33.2%', height: '34.6%', background: 'linear-gradient(120deg,#fff,#eef5fd 50%,#fff)' }}>
              <div>
                <p className="hidden md:block text-[2.9cqw] tracking-[.14em] font-light">Bringing joy to</p>
                <p className="text-[7.5cqw] md:text-[5.4cqw] leading-tight font-extrabold tracking-[.04em] md:tracking-[.06em]"><span className="text-royal">20+</span> Events</p>
                <p className="hidden md:block text-[2.9cqw] tracking-[.14em] font-light">and still counting</p>
              </div>
            </div>
          </div>
          <p className="md:hidden mt-6 text-center text-xl font-light tracking-wide">Bringing joy to <b className="font-extrabold text-royal">20+ Events</b><br />and still counting</p>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="pb-12 md:pb-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <div className="text-center"><p className="eyebrow">Portfolio</p><h2 className="mt-3 text-2xl md:text-4xl font-extrabold uppercase">Momen yang <span className="text-royal">Kami Abadikan</span></h2></div>
          <div className="mt-8 flex justify-center gap-3 flex-wrap" role="tablist">
            {CATS.map((c) => <button key={c} className="chip" data-on={cat === c} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div className="mt-8 md:mt-10 columns-2 md:columns-3 gap-3 md:gap-5">
            {shown.map((t, i) => (
              <figure key={cat + i} className="pop relative mb-3 md:mb-5 break-inside-avoid rounded-2xl md:rounded-3xl overflow-hidden group bg-[#F3F6FB] cursor-pointer" onClick={() => setSel(t)} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="grayscale group-hover:grayscale-0 group-hover:scale-105 transition duration-700 ease-out" style={col(...(t.r as [number, number, number, number]))} />
                <div className="absolute inset-x-0 bottom-0 pt-14 md:pt-20 px-3 md:px-5 pb-3 md:pb-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-brand px-2.5 py-0.5 rounded-full">{t.c}</span>
                  <figcaption className="mt-1.5 text-xs md:text-sm font-semibold leading-snug">{t.n} - {t.l} - {t.y}</figcaption>
                </div>
                <button onClick={() => setSel(t)} className="hidden md:block absolute top-4 right-4 h-10 px-4 rounded-full bg-white text-brand text-sm font-semibold shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 focus:opacity-100 transition">Lihat Detail</button>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {sel && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4 md:p-6" onClick={() => setSel(null)}>
          <div className="pop bg-white rounded-3xl overflow-hidden max-w-[760px] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="grayscale" style={col(...(sel.r as [number, number, number, number]))} />
            <div className="p-5 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
              <div><span className="eyebrow">{sel.c}</span><h3 className="mt-1 text-xl font-bold">{sel.n}</h3><p className="text-sm text-ink/65">{sel.l} - {sel.y}</p></div>
              <div className="flex flex-col md:flex-row gap-3"><Link to="/booking-photobooth" className="btn btn-primary">Booking Photobooth</Link><button onClick={() => setSel(null)} className="btn btn-outline">Tutup</button></div>
            </div>
          </div>
        </div>
      )}

      {/* OCCASION */}
      <section className="py-12 md:py-24 bg-[#f3f8fe]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <h2 className="text-center text-2xl md:text-4xl font-extrabold uppercase"><span className="text-royal">Perfect</span> for Every Occasion</h2>
          <p className="text-center mt-3 text-ink/70">Apa pun acaranya, Campose siap bikin semua orang tersenyum.</p>
          <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-6">
            {OCC.map(([ic, t, d]) => (
              <div key={t} className="card p-5 md:p-7 flex md:block items-center md:items-start gap-4 hover:-translate-y-1.5 transition duration-300">
                <span className="w-14 h-14 shrink-0 rounded-2xl bg-brand text-white grid place-items-center"><Icon n={ic} s={26} /></span>
                <div><h3 className="md:mt-5 font-bold text-base md:text-lg leading-snug">{t}</h3>
                <p className="mt-1 md:mt-2 text-sm text-ink/65 leading-relaxed">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAYANAN */}
      <section id="layanan" className="py-12 md:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <div className="text-center"><p className="eyebrow">Layanan</p><h2 className="mt-3 text-2xl md:text-4xl font-extrabold uppercase">Pilih Booth <span className="text-royal">Favoritmu</span></h2></div>
          <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-stretch">
            {/* Photobox */}
            <div className="rounded-2xl md:rounded-3xl p-6 md:p-7 flex flex-col text-white bg-[#1A76D2]">
              <Icon n="pin" s={34} />
              <h3 className="mt-6 text-2xl font-bold uppercase tracking-wide">Photobox</h3>
              <p className="mt-2 text-white/95 text-sm leading-relaxed">Photobox self-service di lokasi mitra kami. Foto, cetak, langsung bawa pulang.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="px-3 py-1.5 rounded-full bg-white text-brand">Lekha Cafe</span></div>
              <p className="mt-4 text-sm flex-1 flex gap-2 items-start text-white/95"><Icon n="gift" s={18} className="shrink-0 mt-0.5" /> Dapatkan voucher dari promo mitra.</p>
              <Link to="/photobox" className="btn mt-6 !h-11 bg-white !text-brand hover:bg-[#eaf3fc]">Lihat Lokasi & Promo</Link>
            </div>
            {/* Photobooth */}
            <div className="rounded-2xl md:rounded-3xl p-6 md:p-7 flex flex-col text-white bg-[#FF5FBF]">
              <Icon n="camera" s={34} />
              <h3 className="mt-6 text-2xl font-bold uppercase tracking-wide">Photobooth</h3>
              <p className="mt-2 text-white/95 text-sm leading-relaxed flex-1">Sewa photobooth untuk acaramu: wedding, kampus, kantor, aktivasi brand. Pilih durasi 2, 4, atau 8 jam. Cetak tanpa batas + hasil digital instan.</p>
              <Link to="/booking-photobooth" className="btn mt-6 !h-11 bg-white !text-[#E0359F] hover:bg-[#fff0fa]">Booking Photobooth</Link>
            </div>
            {/* Custom Frame */}
            <div className="rounded-2xl md:rounded-3xl p-6 md:p-7 flex flex-col text-white bg-[#C26AE8]">
              <Icon n="pen" s={34} />
              <h3 className="mt-6 text-2xl font-bold uppercase tracking-wide">Custom Frame</h3>
              <p className="mt-2 font-bold text-lg leading-snug">Design Your Photostrip (Free!)</p>
              <p className="mt-2 text-white/95 text-sm leading-relaxed">Rancang photostrip impianmu sendiri, gratis! Pilih tema dan warna, atur layout foto, lalu tambahkan nama acara atau logo biar tiap cetakan jadi kenangan yang personal.</p>
              {/* <ul className="mt-4 mb-1 space-y-2 text-sm flex-1">
                {['Gratis, tanpa biaya desain', 'Tema, warna, dan layout bebas', 'Bisa tambah logo & teks acara'].map((t) => <li key={t} className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-white/25 grid place-items-center shrink-0"><Icon n="check" s={12} /></span>{t}</li>)}
              </ul> */}
              <a href={GFORM} target="_blank" rel="noreferrer" className="btn mt-6 !h-11 bg-white !text-[#9a3fc7] hover:bg-[#f7ecfd]">Buat Desain</a>
            </div>
            {/* Photo-Videography */}
            <div className="rounded-2xl md:rounded-3xl p-6 md:p-7 flex flex-col text-white bg-[#FF5A5A]">
              <Icon n="video" s={34} />
              <h3 className="mt-6 text-2xl font-bold uppercase tracking-wide">Photo-Videography</h3>
              <p className="mt-2 text-white/95 text-sm leading-relaxed flex-1">Dokumentasi foto dan video profesional untuk eventmu.</p>
              <a href={WA} target="_blank" rel="noreferrer" className="btn mt-6 !h-11 bg-white !text-[#d93a3a] hover:bg-[#fff0f0]">Tanya via WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-12 md:py-24 silk-light">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div><p className="eyebrow">Google Reviews</p><h2 className="mt-3 text-2xl md:text-4xl font-extrabold uppercase">Kata <span className="text-royal">Mereka</span></h2></div>
            <div className="flex items-center justify-between md:justify-start gap-6">
              <div className="md:text-right"><div className="text-5xl font-extrabold leading-none">4,9</div><Stars /><div className="text-xs text-ink/60 mt-1">48 ulasan Google</div></div>
              <div className="flex gap-2">
                <button onClick={() => setRi((ri + REVIEWS.length - 1) % REVIEWS.length)} aria-label="Sebelumnya" className="w-12 h-12 rounded-full border-2 border-brand text-brand grid place-items-center hover:bg-brand hover:text-white"><Icon n="left" /></button>
                <button onClick={() => setRi((ri + 1) % REVIEWS.length)} aria-label="Berikutnya" className="w-12 h-12 rounded-full bg-brand text-white grid place-items-center hover:bg-royal"><Icon n="right" /></button>
              </div>
            </div>
          </div>
          <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {rv.map(([n, t], i) => (
              <figure key={ri + n + i} className={`card p-6 md:p-7 pop ${i > 0 ? 'hidden md:block' : ''}`}>
                <Stars /><blockquote className="mt-4 text-[15px] leading-relaxed text-ink/80">“{t}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3"><span className="w-11 h-11 rounded-full bg-brand text-white grid place-items-center font-bold">{n[0]}</span><span><span className="block font-semibold text-sm">{n}</span><span className="text-xs text-ink/50">via Google</span></span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* COLLAB */}
      <section className="py-12 md:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <div className="relative rounded-2xl md:rounded-[32px] overflow-hidden text-white px-6 py-10 md:px-16 md:py-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-8" style={{ background: 'linear-gradient(120deg,#1A76D2,#1F4FBF)' }}>
            <SilkWaves dark />
            <div className="relative max-w-xl">
              <h2 className="text-[28px] md:text-5xl font-extrabold uppercase leading-tight">Open for<br />Collaborations.</h2>
              <p className="mt-4 text-white/90 leading-relaxed">Terbuka untuk kolaborasi, kemitraan, dan sponsorship. Yuk bikin setiap event lebih berkesan bersama <b>Campose</b>.</p>
            </div>
            <Link to="/kemitraan" className="relative btn btn-white !h-14 !px-8 text-base">Ajukan Kemitraan</Link>
          </div>
        </div>
      </section>
    </>
  )
}
