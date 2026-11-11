import { SilkWaves } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { WA } from '@/data/config'
import { Booking } from '@/features/booking/booking-state'
import { col } from '@/lib/image'
import { Link } from '@/lib/router'

export function PhotoboxPage() {
  return (
    <>
      <section className="relative overflow-hidden text-white py-20" style={{ background: 'linear-gradient(135deg,#1A76D2,#1F4FBF)' }}>
        <SilkWaves dark />
        <div className="relative max-w-[1280px] mx-auto px-5 md:px-8">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-white/80">Photobox · Self-Service</p>
          <h1 className="mt-3 text-[32px] md:text-6xl font-extrabold uppercase leading-tight">Lokasi & Promo<br />Photobox</h1>
          <p className="mt-5 max-w-xl text-lg text-white/90 font-light leading-relaxed">Mesin foto self-service di lokasi mitra kami. Tanpa booking, tinggal datang, foto, cetak, dan bawa pulang.</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          <h2 className="text-3xl font-extrabold uppercase">Lokasi <span className="text-royal">Tersedia</span></h2>
          <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <article className="card p-6 md:p-8 border-t-[6px] border-t-brand">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-extrabold">Lekha Cafe</h3>
                <span className="flex items-center gap-2 bg-[#e3f7ec] text-[#14803c] text-sm font-semibold px-4 py-1.5 rounded-full"><i className="w-2 h-2 rounded-full bg-[#1fa463]" />Aktif</span>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-ink/80">
                <li className="flex gap-3"><Icon n="pin" s={18} className="text-brand shrink-0" /> Kampus IPB Dramaga, Perpustakaan LSI, Bogor</li>
                <li className="flex gap-3"><Icon n="clock" s={18} className="text-brand shrink-0" /> Setiap hari, 10.00 – 22.00 WIB</li>
                <li className="flex gap-3"><Icon n="camera" s={18} className="text-brand shrink-0" /> Self-service, tanpa booking</li>
              </ul>
              <a href="https://maps.app.goo.gl/rikLCFZkUHdxoLMC7" target="_blank" rel="noreferrer" className="btn btn-outline !h-11 mt-6">Buka di Maps</a>
            </article>
            
            <article className="rounded-2xl md:rounded-3xl border-2 border-dashed border-[#bcd5f2] bg-[#F3F6FB] p-6 md:p-8 grid place-items-center text-center">
              <div><span className="w-14 h-14 rounded-2xl bg-white text-brand grid place-items-center mx-auto"><Icon n="plus" s={26} /></span><h3 className="mt-4 text-lg font-bold">Lokasi baru segera hadir</h3><p className="mt-1 text-sm text-ink/60">Lokasi Photobox bisa bertambah sesuai kemitraan.</p></div>
            </article>
          </div>

          <div className="mt-10 md:mt-14 relative rounded-2xl md:rounded-[32px] overflow-hidden text-white p-6 md:p-10 flex flex-col md:flex-row items-stretch md:items-center gap-8 md:gap-10" style={{ background: 'linear-gradient(120deg,#1A76D2,#1F4FBF)' }}>
            <SilkWaves dark />
            <div className="relative flex-1">
              <span className="inline-block bg-white text-brand text-xs font-bold uppercase tracking-[.18em] px-4 py-1.5 rounded-full">Promo Mitra</span>
              <h2 className="mt-4 text-2xl md:text-4xl font-extrabold leading-tight">Belanja Rp200 ribu di Lekha Cafe, dapat voucher photobox!</h2>
              <p className="mt-3 text-white/90 text-sm">Periode: 1 Juli – 31 Agustus 2026</p>
              <h3 className="mt-5 font-bold">Syarat</h3>
              <ol className="mt-2 text-sm text-white/90 space-y-1 list-decimal list-inside">
                <li>Belanja minimal Rp200 ribu dalam satu struk di Lekha Cafe.</li>
                <li>Follow Instagram @campose.event.</li>
                <li>Tag @campose.event dan @lekhacafe di story atau feed, lalu tunjukkan ke kasir.</li>
              </ol>
            </div>
            <div className="relative shrink-0 w-full max-w-[250px] mx-auto bg-white text-ink rounded-3xl ticket p-6 md:p-7 text-center md:-rotate-3 shadow-2xl">
              <div className="text-xs font-bold uppercase tracking-[.2em] text-brand">Voucher</div>
              <div className="mt-2 text-3xl font-extrabold text-royal">Photobox</div>
              <div className="my-4 border-t-2 border-dashed border-[#bcd5f2]" />
              <div className="text-sm text-ink/60">Promo mitra</div><div className="text-2xl font-extrabold">Lekha Cafe</div>
            </div>
          </div>

          <div className="mt-8 md:mt-10 card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8">
            <div><h2 className="text-2xl font-extrabold">Mau Photobox di tempatmu?</h2><p className="mt-1 text-ink/65 text-sm">Kafe, resto, mal, atau kampus: ayo jadi mitra lokasi Campose.</p></div>
            <a href={WA} target="_blank" rel="noreferrer" className="btn btn-primary !h-14 md:!px-8">Hubungi Kami</a>
          </div>
          <p className="mt-6 text-sm text-ink/60 text-center">Mau sewa untuk acara sendiri? Itu layanan <b>Photobooth</b>. <Link to="/booking-photobooth" className="text-brand font-semibold underline">Booking Photobooth</Link></p>
        </div>
      </section>
    </>
  )
}
