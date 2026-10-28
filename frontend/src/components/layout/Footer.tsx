import { Logo } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { Booking } from '@/features/booking/booking-state'
import { Link } from '@/lib/router'

export function Footer() {
  return (
    <footer id="kontak" className="bg-brand text-white">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-10 md:py-16 grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr] gap-8 md:gap-12">
        <div>
          <Logo light size={48} />
          <p className="mt-5 text-white/85 max-w-sm leading-relaxed">Photobooth sewa untuk setiap momen. Cetak foto tanpa batas, kenangan digital instan.</p>
        </div>
        <div>
          <h3 className="font-bold uppercase tracking-[.18em] text-sm mb-5 text-white">Hubungi Kami</h3>
          <ul className="space-y-3 text-white/90 text-[15px]">
            <li className="flex gap-3 items-center min-w-0 break-words"><Icon n="insta" s={18} className="text-white" /> @campose.event</li>
            <li className="flex gap-3 items-center min-w-0 break-words"><Icon n="phone" s={18} className="text-white" /> +62 821-2477-8747</li>
            <li className="flex gap-3 items-center min-w-0 break-words"><Icon n="globe" s={18} className="text-white" /> linkt.ree/campose</li>
            <li className="flex gap-3 items-center min-w-0 break-words"><Icon n="mail" s={18} className="text-white" /> campose.indonesia@gmail.com</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold uppercase tracking-[.18em] text-sm mb-5 text-white">Menu</h3>
          <ul className="space-y-3 text-white/90 text-[15px]">
            <li><Link to="/booking-photobooth" className="hover:text-white hover:underline">Booking Photobooth</Link></li>
            <li><Link to="/photobox" className="hover:text-white hover:underline">Lokasi & Promo Photobox</Link></li>
            <li><Link to="/faq" className="hover:text-white hover:underline">FAQ</Link></li>
            <li><Link to="/kemitraan" className="hover:text-white hover:underline">Kemitraan</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/25 py-5 text-center text-sm text-white/75">© 2026 Campose. Semua hak dilindungi.</div>
    </footer>
  )
}
