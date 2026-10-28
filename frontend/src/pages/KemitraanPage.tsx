import { useState } from 'react'
import { Logo, SilkWaves } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { col } from '@/lib/image'

export function KemitraanPage() {
  const [sent, setSent] = useState(false)
  const [type, setType] = useState('Kemitraan')
  return (
    <>
      <section className="relative overflow-hidden text-white py-12 md:py-24" style={{ background: 'linear-gradient(135deg,#1A76D2,#1F4FBF)' }}>
        <SilkWaves dark />
        <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 text-center"><div className="hidden md:flex justify-center mb-8"><Logo light size={40} /></div>
          <h1 className="text-[32px] md:text-6xl font-extrabold uppercase">Open for Collaborations.</h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-white/90 font-light leading-relaxed">Kami terbuka untuk kolaborasi, kemitraan, dan sponsorship. Yuk bikin setiap event lebih berkesan bersama <b className="font-bold">Campose</b>.</p>
        </div>
      </section>
      <section className="py-20 silk-light">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-8 md:gap-12 items-start">
          <div className="rounded-2xl md:rounded-3xl overflow-hidden grayscale shadow-xl" style={col(265, 0, 315, 217)} />
          <div className="card p-5 md:p-9">
            {sent ? (
              <div className="pop text-center py-10"><span className="w-20 h-20 rounded-full bg-[#e3f7ec] text-[#1fa463] grid place-items-center mx-auto"><Icon n="check" s={40} /></span><h2 className="mt-5 text-2xl font-extrabold">Terima kasih!</h2><p className="mt-2 text-ink/65">Tim kami akan menghubungi kamu dalam 1–2 hari kerja.</p></div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="space-y-4">
                <h2 className="text-2xl font-extrabold uppercase">Ajukan <span className="text-royal">Kerja Sama</span></h2>
                <div className="flex flex-wrap gap-2">{['Kemitraan', 'Sponsorship', 'Kolaborasi'].map((t) => <button type="button" key={t} className="chip" data-on={type === t} onClick={() => setType(t)}>{t}</button>)}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input required className="field" placeholder="Nama lengkap" /><input required className="field" placeholder="Instansi / brand" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input required type="email" className="field" placeholder="Email" /><input required className="field" placeholder="No. WhatsApp" /></div>
                <textarea required rows={4} className="field" placeholder="Ceritakan ide kerja samamu…" />
                <button className="btn btn-primary w-full !h-14 text-base">Kirim Pengajuan</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
