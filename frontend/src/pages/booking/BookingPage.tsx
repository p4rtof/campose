import { Icon } from '@/components/Icon'
import { FEATURES, PACKAGES } from '@/data/catalog'
import { WA } from '@/data/config'
import { FlowSteps } from '@/features/booking/FlowSteps'
import { useBooking } from '@/features/booking/booking-state'
import { fmt } from '@/lib/format'
import { col, occ } from '@/lib/image'
import { navigate } from '@/lib/router'

export function BookingPage() {
  const { set } = useBooking()
  return (
    <section className="bg-white py-10 md:py-16 md:md:min-h-[900px]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <FlowSteps step={0} />
        <div className="text-center mt-8 md:mt-12"><p className="eyebrow">Pilih Paket</p><h1 className="mt-3 text-[28px] md:text-5xl font-extrabold uppercase text-brand">Event Photobooth <span className="text-royal">Pricelist</span></h1></div>
        <div className="mt-8 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {PACKAGES.map((p) => (
            <article key={p.id} className="relative rounded-2xl md:rounded-[28px] overflow-hidden bg-white text-ink border-2 border-brand flex flex-col shadow-[0_24px_50px_-28px_rgba(26,118,210,.7)] hover:-translate-y-2 transition duration-300">
              <div className="relative">
                <div className="grayscale" style={occ(p.id)} />
                <span className="absolute top-4 left-4 px-5 py-2 rounded-xl font-extrabold text-xl bg-white text-brand border-[3px]" style={{ borderColor: p.color }}>{p.title}</span>
                {p.popular && <span className="absolute top-4 right-4 bg-royal text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-full">Paling Populer</span>}
              </div>
              <div className="p-7 flex-1 flex flex-col">
                <div className="self-start px-5 py-2 rounded-lg text-2xl font-extrabold text-brand bg-white border-2 border-brand -mt-12 relative shadow-lg" style={{ borderBottom: `5px solid ${p.color}` }}>{fmt(p.price).replace('Rp', 'Rp ')}</div>
                <ul className="mt-6 space-y-4 flex-1">
                  {FEATURES.map((f) => (
                    <li key={f.t} className="flex gap-3"><span className="mt-1 w-5 h-5 rounded-full grid place-items-center shrink-0" style={{ background: p.color }}><Icon n="check" s={12} /></span><span className="text-sm leading-relaxed text-ink/70"><b className="block text-ink text-[15px]">{f.t}</b>{f.d}</span></li>
                  ))}
                </ul>
                <button onClick={() => { set({ pkg: p.id }); navigate('/detail-pesanan') }} className="btn btn-primary mt-8 !h-14 w-full text-base">Pesan Sekarang</button>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 md:mt-12 card px-5 md:px-8 py-5 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-3xl mx-auto">
          <p className="font-semibold">Butuh durasi custom? <span className="text-royal">Hubungi kami</span></p>
          <a href={WA} target="_blank" className="btn btn-outline !h-12 md:!h-11"><Icon n="chat" s={18} /> WhatsApp</a>
        </div>
      </div>
    </section>
  )
}
