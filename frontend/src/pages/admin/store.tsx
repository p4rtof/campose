import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { io as socketIO, Socket } from 'socket.io-client'
import { useNav } from './router'
import { cx, Icon } from './ui'

export const BASE_URL = 'http://localhost:4000'
export const API = `${BASE_URL}/api/v1/admin`

export type Status = 'menunggu' | 'terkonfirmasi' | 'dibatalkan' | 'selesai' | 'reschedule'
export type PayStatus = 'Menunggu' | 'Bukti Diunggah' | 'Lunas' | 'Ditolak' | 'Kedaluwarsa' | 'Gagal'

export type Booking = {
  id: string
  inv: string
  name: string
  email: string
  wa: string
  pkg: 2 | 4 | 8
  date: string
  start: string
  end: string
  loc: string
  event: string
  guests: number
  note: string
  addons: string[]
  voucher?: string
  status: Status
  method: 'QRIS Dinamis' | 'Transfer Bank'
  pay: PayStatus
  paidAt?: string
  paymentProofUrl?: string
  paymentId?: string
  adminNote?: string
  history: { t: string; label: string; note?: string }[]
  totalPrice?: number
}

export const PKG = { 2: 1299000, 4: 2199000, 8: 4099000 } as const
export const ADDONS: Record<string, number> = {
  'Backdrop Custom': 350000,
  'Props Premium': 250000,
  'Album Digital QR': 150000,
  'Operator Tambahan': 200000,
  'Bebas Kostum Onesie/Hanbok': 15000,
  'Seluruh file foto edit (Gdrive)': 10000,
  'Tambah background': 30000,
  'Tambah orang': 25000,
  'Tambah waktu': 25000,
  'Cetak 4R warna': 10000,
  'Cetak 10RS/A4 warna': 25000,
  'Figura 4R': 15000,
  'Figura 10RS/A4': 49000,
  'Bawa hewan': 25000,
  'Tambahan desain kolase': 5000,
}

export const VOUCHERS: Record<string, { type: 'persen' | 'nominal'; val: number }> = {
  CAMPOSE10: { type: 'persen', val: 10 },
  HEMAT100: { type: 'nominal', val: 100000 },
}

export const rp = (n: number) => 'Rp' + (n || 0).toLocaleString('id-ID')
export const fd = (d: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!d) return '-'
  try {
    const raw = d.includes('T') ? d : `${d}T00:00:00`
    return new Date(raw).toLocaleDateString('id-ID', o)
  } catch {
    return d
  }
}
export const TODAY = new Date().toISOString().slice(0, 10)

export function price(b: Booking) {
  if (b.totalPrice !== undefined && b.totalPrice > 0) {
    const base = PKG[b.pkg] || 1299000
    return { base, add: 0, disc: 0, total: b.totalPrice }
  }
  const base = PKG[b.pkg] || 1299000
  const add = (b.addons || []).reduce((s, a) => s + (ADDONS[a] || 0), 0)
  const v = b.voucher ? VOUCHERS[b.voucher] : undefined
  const disc = v ? (v.type === 'persen' ? Math.round(((base + add) * v.val) / 100) : v.val) : 0
  return { base, add, disc, total: Math.max(0, base + add - disc) }
}

export const STATUS: Record<Status, { label: string; chip: string; dot: string; block: string }> = {
  menunggu: { label: 'Menunggu Pembayaran', chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', block: 'bg-amber-100 text-amber-900 border-amber-300' },
  terkonfirmasi: { label: 'Dikonfirmasi', chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', block: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  dibatalkan: { label: 'Dibatalkan', chip: 'bg-red-100 text-red-700', dot: 'bg-red-500', block: 'bg-red-100 text-red-800 border-red-300 line-through' },
  selesai: { label: 'Selesai', chip: 'bg-blue-100 text-blue-800', dot: 'bg-brand', block: 'bg-blue-100 text-blue-900 border-blue-300' },
  reschedule: { label: 'Reschedule', chip: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500', block: 'bg-purple-100 text-purple-900 border-purple-300' },
}

export const Badge = ({ s }: { s: Status }) => {
  const item = STATUS[s] || STATUS.menunggu
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium', item.chip)}>
      <i className={cx('size-1.5 rounded-full', item.dot)} />{item.label}
    </span>
  )
}

export const PAYCHIP: Record<PayStatus, string> = {
  Menunggu: 'bg-amber-100 text-amber-800',
  'Bukti Diunggah': 'bg-purple-100 text-purple-800 ring-2 ring-purple-300 animate-pulse',
  Lunas: 'bg-emerald-100 text-emerald-800',
  Ditolak: 'bg-red-200 text-red-800',
  Kedaluwarsa: 'bg-slate-200 text-slate-700',
  Gagal: 'bg-red-100 text-red-700',
}

export type Route = { p: string; id?: string; code?: string; tab?: string }
export type V = { code: string; type: 'persen' | 'nominal'; val: number; min: number; from: string; to: string; quota: number; used: number; on: boolean }

export const TABS = [['paket', 'Paket & Harga'], ['add-on', 'Add On'], ['syarat', 'Syarat & Ketentuan'], ['admin', 'Akun Admin']] as const

// Helper transform backend booking DB record -> frontend UI Booking object
function mapDbBooking(raw: any): Booking {
  const latestPay = raw.payments?.[0]
  const payStatusMap: Record<string, PayStatus> = {
    PENDING: 'Menunggu',
    MENUNGGU_KONFIRMASI: 'Bukti Diunggah',
    PAID: 'Lunas',
    DITOLAK: 'Ditolak',
    EXPIRED: 'Kedaluwarsa',
    FAILED: 'Gagal',
  }
  const statusMap: Record<string, Status> = {
    MENUNGGU_PEMBAYARAN: 'menunggu',
    TERKONFIRMASI: 'terkonfirmasi',
    SELESAI: 'selesai',
    DIBATALKAN: 'dibatalkan',
  }

  const rawDate = typeof raw.eventDate === 'string' ? raw.eventDate.slice(0, 10) : new Date(raw.eventDate).toISOString().slice(0, 10)
  const pkgHours = (raw.package?.hours === 8 ? 8 : raw.package?.hours === 2 ? 2 : 4) as 2 | 4 | 8

  return {
    id: raw.id,
    inv: raw.code,
    name: raw.customerName,
    email: raw.email || '-',
    wa: raw.whatsapp || '-',
    pkg: pkgHours,
    date: rawDate,
    start: raw.startTime || '10:00',
    end: raw.endTime || '14:00',
    loc: raw.location || '-',
    event: raw.eventName || raw.eventType || 'Event Photobooth',
    guests: raw.guestCount || 0,
    note: raw.notes || '',
    addons: raw.addons?.map((a: any) => a.addon?.name).filter(Boolean) || [],
    voucher: raw.voucherCode || undefined,
    status: statusMap[raw.status] || 'menunggu',
    method: latestPay?.method === 'QRIS' ? 'QRIS Dinamis' : 'Transfer Bank',
    pay: latestPay ? (payStatusMap[latestPay.status] || 'Menunggu') : 'Menunggu',
    paidAt: latestPay?.paidAt ? new Date(latestPay.paidAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
    paymentProofUrl: latestPay?.paymentProofUrl || undefined,
    paymentId: latestPay?.id,
    adminNote: latestPay?.adminNote || undefined,
    totalPrice: raw.total,
    history: [
      { t: new Date(raw.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), label: 'Booking dibuat' },
      ...(latestPay?.uploadedAt ? [{ t: new Date(latestPay.uploadedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), label: 'Bukti pembayaran diunggah' }] : []),
      ...(latestPay?.paidAt ? [{ t: new Date(latestPay.paidAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), label: 'Pembayaran dikonfirmasi lunas' }] : []),
    ],
  }
}

type S = {
  route: Route
  go: (p: string, id?: string, extra?: string) => void
  bookings: Booking[]
  get: (id?: string) => Booking
  setStatus: (id: string, s: Status, label: string, note?: string, patch?: Partial<Booking>) => void
  confirmPayment: (bookingIdOrInv: string, adminNote?: string) => Promise<boolean>
  rejectPayment: (bookingIdOrInv: string, adminNote?: string) => Promise<boolean>
  rescheduleBooking: (inv: string, date: string, start: string, end: string) => Promise<boolean>
  cancelBooking: (inv: string, reason: string) => Promise<boolean>
  completeBooking: (inv: string) => Promise<boolean>
  add: (b: any) => Promise<void>
  toast: (m: string, kind?: 'ok' | 'err') => void
  q: string
  setQ: (q: string) => void
  vouchers: V[]
  setVouchers: React.Dispatch<React.SetStateAction<V[]>>
  refreshBookings: () => Promise<void>
  availability: Record<string, 'tersedia' | 'penuh' | 'libur'>
  setDayAvailability: (date: string, status: 'tersedia' | 'penuh' | 'libur') => Promise<void>
  stats: { totalBookings: number; pendingProof: number; confirmed: number; totalRevenue: number } | null
}

const Ctx = createContext<S>(null!)
export const useApp = () => useContext(Ctx)

export function Provider({ children }: { children: ReactNode }) {
  const { loc, navigate } = useNav()
  const [bookings, setB] = useState<Booking[]>([])
  const [vouchers, setVouchers] = useState<V[]>([])
  const [availability, setAvailability] = useState<Record<string, 'tersedia' | 'penuh' | 'libur'>>({})
  const [stats, setStats] = useState<{ totalBookings: number; pendingProof: number; confirmed: number; totalRevenue: number } | null>(null)
  const [q, setQ] = useState('')
  const [t, setT] = useState<{ m: string; kind: 'ok' | 'err'; k: number } | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('campose-token') || localStorage.getItem('admin_token') || '') : ''

  const toast = useCallback((m: string, kind: 'ok' | 'err' = 'ok') => {
    const k = Date.now()
    setT({ m, kind, k })
    setTimeout(() => setT((x) => (x?.k === k ? null : x)), 3200)
  }, [])

  // 1. Fetch bookings & data from real backend
  const refreshBookings = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/bookings?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.data?.items) {
          const mapped = data.data.items.map(mapDbBooking)
          setB(mapped)
        }
      }
      // Also fetch stats
      const statsRes = await fetch(`${API}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (statsRes.ok) {
        const sData = await statsRes.json()
        if (sData.data) setStats(sData.data)
      }
    } catch (err) {
      console.warn('Gagal memuat bookings dari backend:', err)
    }
  }, [token])

  // 2. Fetch vouchers
  const refreshVouchers = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/vouchers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          const mapped: V[] = data.data.map((item: any) => ({
            code: item.code,
            type: 'nominal',
            val: item.discountAmount,
            min: 0,
            from: item.validFrom ? item.validFrom.slice(0, 10) : '2026-01-01',
            to: item.validUntil ? item.validUntil.slice(0, 10) : '2026-12-31',
            quota: item.quota || 100,
            used: item.used || 0,
            on: item.isActive,
          }))
          setVouchers(mapped)
        }
      }
    } catch {}
  }, [token])

  // 3. Fetch availability
  const refreshAvailability = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          const map: Record<string, 'tersedia' | 'penuh' | 'libur'> = {}
          data.data.forEach((item: any) => {
            const d = item.date.slice(0, 10)
            map[d] = item.status === 'PENUH' ? 'penuh' : item.status === 'DIBOOKING' ? 'libur' : 'tersedia'
          })
          setAvailability(map)
        }
      }
    } catch {}
  }, [token])

  useEffect(() => {
    refreshBookings()
    refreshVouchers()
    refreshAvailability()
  }, [refreshBookings, refreshVouchers, refreshAvailability])

  // 4. Setup Realtime Socket.IO
  useEffect(() => {
    if (!token) return
    const socket = socketIO(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('admin:join', token)
    })

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    // Customer baru membuat booking di website
    socket.on('booking:created', (data: any) => {
      toast(`🔔 Booking baru dari ${data.customerName}! (${data.code})`, 'ok')
      refreshBookings()
    })

    // Customer mengunggah bukti pembayaran
    socket.on('payment:proof_uploaded', (data: any) => {
      toast(`📸 Bukti bayar baru diunggah oleh ${data.customerName}! (${data.bookingCode})`, 'ok')
      refreshBookings()
    })

    // Pembayaran dikonfirmasi
    socket.on('payment:confirmed', (data: any) => {
      toast(`✅ Pembayaran ${data.bookingCode} dikonfirmasi Lunas!`, 'ok')
      refreshBookings()
    })

    // Pembayaran ditolak
    socket.on('payment:rejected', (data: any) => {
      toast(`❌ Pembayaran ${data.bookingCode} ditolak.`, 'err')
      refreshBookings()
    })

    // Status booking diperbarui
    socket.on('booking:updated', () => {
      refreshBookings()
    })

    return () => {
      socket.disconnect()
    }
  }, [token, refreshBookings, toast])

  // 5. Action: Confirm Payment (ACC Bukti Bayar)
  const confirmPayment = async (bookingIdOrInv: string, adminNote?: string): Promise<boolean> => {
    const target = bookings.find((b) => b.id === bookingIdOrInv || b.inv === bookingIdOrInv)
    if (!target) return false
    const paymentId = target.paymentId
    if (!paymentId) {
      toast('Payment ID tidak ditemukan', 'err')
      return false
    }

    try {
      const res = await fetch(`${API}/payments/${paymentId}/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNote: adminNote || 'Disetujui oleh admin' }),
      })
      const data = await res.json()
      if (res.ok) {
        toast(`✅ Pembayaran ${target.inv} berhasil di-ACC & Lunas!`, 'ok')
        refreshBookings()
        return true
      } else {
        toast(data.error?.message || 'Gagal mengonfirmasi pembayaran', 'err')
        return false
      }
    } catch {
      toast('Terjadi kesalahan koneksi', 'err')
      return false
    }
  }

  // 6. Action: Reject Payment (Tolak Bukti Bayar)
  const rejectPayment = async (bookingIdOrInv: string, adminNote?: string): Promise<boolean> => {
    const target = bookings.find((b) => b.id === bookingIdOrInv || b.inv === bookingIdOrInv)
    if (!target) return false
    const paymentId = target.paymentId
    if (!paymentId) {
      toast('Payment ID tidak ditemukan', 'err')
      return false
    }

    try {
      const res = await fetch(`${API}/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNote: adminNote || 'Bukti tidak sesuai' }),
      })
      const data = await res.json()
      if (res.ok) {
        toast(`❌ Bukti bayar ${target.inv} ditolak.`, 'err')
        refreshBookings()
        return true
      } else {
        toast(data.error?.message || 'Gagal menolak pembayaran', 'err')
        return false
      }
    } catch {
      toast('Terjadi kesalahan koneksi', 'err')
      return false
    }
  }

  // 7. Action: Ubah Jadwal
  const rescheduleBooking = async (inv: string, date: string, start: string, end: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/bookings/${inv}/reschedule`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, startTime: start, endTime: end }),
      })
      if (res.ok) {
        toast(`Jadwal ${inv} berhasil diubah ke ${fd(date)}`, 'ok')
        refreshBookings()
        return true
      }
    } catch {}
    return false
  }

  // 8. Action: Batalkan Booking
  const cancelBooking = async (inv: string, reason: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/bookings/${inv}/cancel`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        toast(`Booking ${inv} berhasil dibatalkan.`, 'err')
        refreshBookings()
        return true
      }
    } catch {}
    return false
  }

  const completeBooking = async (inv: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/bookings/${inv}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'SELESAI' }),
      })
      if (res.ok) {
        toast(`Booking ${inv} ditandai selesai.`, 'ok')
        refreshBookings()
        return true
      }
    } catch {}
    return false
  }

  // 9. Action: Add Manual Booking
  const add = async (b: any) => {
    try {
      const res = await fetch(`${API}/bookings/manual`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: b.name,
          whatsapp: b.wa,
          packageHours: b.pkg,
          eventDate: b.date,
          startTime: b.start,
          location: b.loc,
          eventName: b.event,
        }),
      })
      if (res.ok) {
        toast('Booking manual berhasil disimpan ke database', 'ok')
        await refreshBookings()
      } else {
        const err = await res.json()
        toast(err.error?.message || 'Gagal menyimpan booking', 'err')
      }
    } catch {
      toast('Gagal terhubung ke database', 'err')
    }
  }

  // 10. Action: Update status generic
  const setStatus: S['setStatus'] = async (id, s, label, note, patch) => {
    const target = bookings.find((b) => b.id === id || b.inv === id)
    if (!target) return
    const dbStatusMap: Record<Status, string> = {
      menunggu: 'MENUNGGU_PEMBAYARAN',
      terkonfirmasi: 'TERKONFIRMASI',
      selesai: 'SELESAI',
      dibatalkan: 'DIBATALKAN',
      reschedule: 'TERKONFIRMASI',
    }

    try {
      await fetch(`${API}/bookings/${target.inv}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: dbStatusMap[s] }),
      })
    } catch {}

    setB((list) =>
      list.map((b) =>
        b.id === id || b.inv === id
          ? {
              ...b,
              ...patch,
              status: s,
              history: [
                ...b.history,
                { t: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), label, note },
              ],
            }
          : b,
      ),
    )
  }

  // 11. Action: Atur ketersediaan kalender
  const setDayAvailability = async (date: string, status: 'tersedia' | 'penuh' | 'libur') => {
    const dbStatus = status === 'penuh' ? 'PENUH' : status === 'libur' ? 'DIBOOKING' : 'TERSEDIA'
    try {
      await fetch(`${API}/availability`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, status: dbStatus }),
      })
      setAvailability((prev) => ({ ...prev, [date]: status }))
    } catch {}
  }

  const get = (id?: string) => bookings.find((b) => b.id === id || b.inv === id) ?? bookings[0] ?? {
    id: 'placeholder',
    inv: 'CMP-2026-0000',
    name: '-',
    email: '-',
    wa: '-',
    pkg: 4,
    date: TODAY,
    start: '10:00',
    end: '14:00',
    loc: '-',
    event: '-',
    guests: 0,
    note: '',
    addons: [],
    status: 'menunggu' as Status,
    method: 'Transfer Bank' as const,
    pay: 'Menunggu' as PayStatus,
    history: [],
  }

  // Parse path untuk router internal admin
  const cleanPath = loc.replace(/^\/admin/, '') || '/'
  const u = new URL(cleanPath, 'http://x')
  const parts = u.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  const byInv = (inv?: string) => bookings.find((b) => b.inv === inv || b.id === inv)?.id

  let route: Route = { p: 'notfound' }
  const [a, b2] = parts
  if (!a || (a === 'dashboard' && parts.length === 1)) route = { p: 'dashboard' }
  else if (parts.length > 2) route = { p: 'notfound' }
  else if (a === 'booking') route = !b2 ? { p: 'booking' } : b2 === 'tambah' ? { p: 'tambah' } : byInv(b2) ? { p: 'detail', id: byInv(b2) } : { p: 'detail', id: b2 }
  else if (a === 'pembayaran') route = !b2 ? { p: 'payments' } : byInv(b2) ? { p: 'invoice', id: byInv(b2) } : { p: 'invoice', id: b2 }
  else if (a === 'kalender' && !b2) route = { p: 'calendar' }
  else if (a === 'voucher') route = !b2 ? { p: 'voucher' } : b2 === 'baru' ? { p: 'voucherForm' } : vouchers.some((v) => v.code === b2) ? { p: 'voucherForm', code: b2 } : { p: 'voucherForm', code: b2 }
  else if (a === 'pengaturan' && !b2) route = { p: 'settings', tab: TABS.find(([k]) => k === u.searchParams.get('tab'))?.[0] ?? 'paket' }

  const go: S['go'] = (p, id, extra) => {
    const inv = bookings.find((x) => x.id === id || x.inv === id)?.inv || id
    const to: Record<string, string> = {
      dashboard: '/admin',
      booking: '/admin/booking',
      tambah: '/admin/booking/tambah',
      detail: '/admin/booking/' + inv,
      calendar: '/admin/kalender',
      payments: '/admin/pembayaran',
      invoice: '/admin/pembayaran/' + inv,
      voucher: '/admin/voucher',
      voucherForm: '/admin/voucher/' + (extra ?? 'baru'),
      settings: '/admin/pengaturan',
    }
    navigate(to[p] ?? '/admin')
  }

  return (
    <Ctx.Provider
      value={{
        route,
        go,
        bookings,
        get,
        setStatus,
        confirmPayment,
        rejectPayment,
        rescheduleBooking,
        cancelBooking,
        completeBooking,
        add,
        toast,
        q,
        setQ,
        vouchers,
        setVouchers,
        refreshBookings,
        availability,
        setDayAvailability,
        stats,
      }}
    >
      {children}
      {t && (
        <div
          className="pop fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-2xl lg:inset-x-auto lg:right-6 lg:bottom-6 lg:mx-0"
          role="status"
        >
          <span
            className={cx(
              'grid size-6 place-items-center rounded-full shrink-0',
              t.kind === 'ok' ? 'bg-emerald-500' : 'bg-red-500',
            )}
          >
            <Icon n={t.kind === 'ok' ? 'check' : 'x'} s={14} />
          </span>
          <span className="flex-1">{t.m}</span>
        </div>
      )}
    </Ctx.Provider>
  )
}
