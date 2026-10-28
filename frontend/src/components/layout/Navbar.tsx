import type React from 'react'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { Booking } from '@/features/booking/booking-state'
import { col } from '@/lib/image'
import { Link, navigate } from '@/lib/router'

export const NAV = [
  ['Beranda', '/'], ['Portfolio', '/#portfolio'], ['Layanan', '/#layanan'], ['Photobox', '/photobox'], ['FAQ', '/faq'], ['Kemitraan', '/kemitraan'], ['Hubungi Kami', '/#kontak'],
]
export function Navbar({ path }: { path: string }) {
  const [open, setOpen] = useState(false)
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  const go = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    if (to.includes('#')) {
      const [pp, id] = to.split('#')
      if (window.location.pathname !== (pp || '/')) navigate(pp || '/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80)
    } else navigate(to)
  }
  return (
    <header className="sticky top-0 z-40 bg-brand shadow-[0_8px_24px_-12px_rgba(26,118,210,.8)]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <Link to="/"><span className="md:hidden"><Logo light size={34} /></span><span className="hidden md:block"><Logo light size={44} /></span></Link>
        <nav className="hidden md:flex items-center gap-9" aria-label="Utama">
          {NAV.map(([l, to]) => (
            <a key={l} href={to} onClick={go(to)} className={`text-[15px] font-medium text-white transition hover:text-white ${path === to ? 'border-b-2 border-white pb-0.5' : 'opacity-85 hover:opacity-100'}`}>{l}</a>
          ))}
        </nav>
        <Link to="/booking-photobooth" className="btn btn-white hidden md:inline-flex">Booking Photobooth</Link>
        <button className="md:hidden w-11 h-11 -mr-2 grid place-items-center text-white" aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} onClick={() => setOpen(!open)}><Icon n={open ? 'x' : 'menu'} s={26} /></button>
      </div>
      {open && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-white overflow-y-auto pop">
          <nav className="px-5 pt-4 pb-8 flex flex-col" aria-label="Menu mobile">
            {NAV.map(([l, to]) => (
              <a key={l} href={to} onClick={go(to)} className={`flex items-center justify-between min-h-[56px] border-b border-[#e3edf9] text-lg font-semibold ${path === to ? 'text-brand' : 'text-ink'}`}>{l}<Icon n="right" s={18} className="text-brand" /></a>
            ))}
            <Link to="/booking-photobooth" className="btn btn-primary mt-6 !h-14 text-base"><span onClick={() => setOpen(false)}>Booking Photobooth</span></Link>
          </nav>
        </div>
      )}
    </header>
  )
}
