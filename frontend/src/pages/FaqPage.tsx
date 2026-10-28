import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { Booking } from '@/features/booking/booking-state'

const FAQS = [
  ['Apa bedanya Photobox dan Photobooth?', 'Photobox adalah mesin self-service yang ditempatkan di lokasi mitra (saat ini Lekha Cafe), tanpa booking, dan punya promo mitra berupa voucher Photobox. Photobooth adalah layanan sewa per durasi (2/4/8 jam) untuk event tertentu yang kamu selenggarakan, dipesan lewat halaman Booking Photobooth.'],
  ['Bagaimana cara booking photobooth?', 'Klik "Booking Photobooth", pilih paket, tentukan tanggal & jam, isi detail event, lalu lanjut ke invoice dan pembayaran.'],
  ['Berapa lama durasi sewa?', 'Tersedia paket 2, 4, dan 8 jam. Butuh durasi lain? Hubungi kami via WhatsApp untuk paket custom.'],
  ['Apakah cetak foto benar-benar unlimited?', 'Ya, cetak foto tanpa batas selama sesi berlangsung.'],
  ['Bagaimana cara memakai voucher?', 'Voucher Photobox didapat dari promo mitra, misalnya belanja Rp200 ribu di Lekha Cafe. Cek periode dan syaratnya di halaman Lokasi & Promo Photobox, lalu tunjukkan ke kasir Lekha Cafe.'],
  ['Metode pembayaran apa saja yang tersedia?', 'QRIS dinamis dan transfer Virtual Account BCA, BNI, BRI, dan Mandiri.'],
  ['Apakah ada biaya transport?', 'Gratis untuk area Jabodetabek. Di luar area akan dihitung setelah konfirmasi.'],
  ['Bagaimana jika ingin reschedule?', 'Hubungi CS minimal 7 hari sebelum event, jadwal bisa dipindah sesuai ketersediaan.'],
  ['Kapan hasil digital bisa diakses?', 'Foto digital dan GIF bisa diakses langsung via link setelah sesi berlangsung.'],
]
export function FaqPage() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<number | null>(0)
  const list = FAQS.filter(([a, b]) => (a + b).toLowerCase().includes(q.toLowerCase()))
  return (
    <section className="silk-light py-10 md:py-20 md:min-h-[800px]">
      <div className="max-w-[860px] mx-auto px-5 md:px-8">
        <div className="text-center"><p className="eyebrow">FAQ</p><h1 className="mt-3 text-[28px] md:text-5xl font-extrabold uppercase">Pertanyaan <span className="text-royal">Umum</span></h1></div>
        <div className="relative mt-10"><Icon n="search" className="absolute left-5 top-1/2 -translate-y-1/2 text-brand" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pertanyaan…" className="field !h-14 !rounded-full !pl-14" /></div>
        <div className="mt-8 space-y-3">
          {list.map(([a, b], i) => (
            <div key={a} className="card !rounded-2xl overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-semibold" aria-expanded={open === i}>{a}<span className="w-9 h-9 rounded-full bg-[#e6f2ff] text-brand grid place-items-center shrink-0"><Icon n={open === i ? 'minus' : 'plus'} s={18} /></span></button>
              {open === i && <p className="pop px-6 pb-6 text-ink/70 leading-relaxed">{b}</p>}
            </div>
          ))}
          {!list.length && <p className="text-center text-ink/60 py-10">Tidak ada hasil. Coba kata kunci lain atau hubungi CS.</p>}
        </div>
      </div>
    </section>
  )
}
