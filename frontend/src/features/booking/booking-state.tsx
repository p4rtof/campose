import { createContext, useContext, useEffect, useState } from 'react'
import { ADDONS, PACKAGES, VOUCHERS } from '@/data/catalog'
import { dateLabel, endTime } from '@/lib/format'

export type Booking = {
  pkg: number; month: number; day: number | null; time: string | null
  lokasi: string; jenis: string; catatan: string
  first: string; last: string; email: string; wa: string
  voucher: string; qty: Record<number, number>
  acara: string; tamu: string; instansi: string; addons: number[]; agree: boolean
}

// Ambil bulan & hari saat ini secara otomatis
const now = new Date()
const currentMonth = now.getMonth() + 1
const currentDay = now.getDate()

export const emptyBooking: Booking = { 
  pkg: 1, 
  month: currentMonth, 
  day: null, 
  time: null, 
  lokasi: '', 
  jenis: '', 
  catatan: '', 
  first: '', 
  last: '', 
  email: '', 
  wa: '', 
  voucher: '', 
  qty: {}, 
  acara: '', 
  tamu: '', 
  instansi: '', 
  addons: [], 
  agree: false 
}

export const demoBooking: Partial<Booking> = { 
  month: currentMonth, 
  day: currentDay, 
  time: '14.00', 
  lokasi: 'Gedung Serbaguna Kemang, Jakarta Selatan', 
  jenis: 'Wedding', 
  first: 'Nadia', 
  last: 'Putri', 
  email: 'nadia.putri@gmail.com', 
  wa: '081234567890', 
  acara: 'Pernikahan Nadia & Raka', 
  tamu: '250', 
  instansi: '' 
}

export const BookingCtx = createContext<{ b: Booking; set: (p: Partial<Booking>) => void }>({ b: emptyBooking, set: () => {} })
export const useBooking = () => useContext(BookingCtx)

export function resolved(b: Booking) {
  const m = b.day ? b.month : demoBooking.month!
  const d = b.day ?? demoBooking.day!
  const t = b.day && b.time ? b.time : demoBooking.time!
  const pkg = PACKAGES[b.pkg] || PACKAGES[1]
  const addons = b.addons.map((i) => {
    const q = b.qty[i] ?? 1
    const found = ADDONS[i] || ADDONS.find((_, idx) => idx + 1 === i) || [`Add-on #${i}`, 0]
    return [found[0], (found[1] || 0) * q, q] as [string, number, number]
  })
  const addonTotal = addons.reduce((s, a) => s + a[1], 0)
  const discount = VOUCHERS[b.voucher] ?? 0
  return {
    pkg, month: m, day: d, time: t, date: dateLabel(m, d), range: `${t} – ${endTime(t, pkg.hours)} WIB`,
    lokasi: b.lokasi || demoBooking.lokasi!, jenis: b.jenis || demoBooking.jenis!,
    nama: b.first ? `${b.first} ${b.last}`.trim() : `${demoBooking.first} ${demoBooking.last}`,
    email: b.email || demoBooking.email!, wa: b.wa || demoBooking.wa!, addons, addonTotal, discount, voucher: discount ? b.voucher : '', total: Math.max(0, pkg.price + addonTotal - discount),
  }
}

export function useCountdown(sec: number) {
  const [s, setS] = useState(sec)
  useEffect(() => { const i = setInterval(() => setS((x) => Math.max(0, x - 1)), 1000); return () => clearInterval(i) }, [])
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return { h: p(h), m: p(m), s: p(r), text: h ? `${p(h)}:${p(m)}:${p(r)}` : `${p(m)}:${p(r)}` }
}
