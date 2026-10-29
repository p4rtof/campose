import type React from 'react'
import { useState, useEffect, type ReactNode } from 'react'
import { io as socketIO } from 'socket.io-client'
import { Icon } from '@/components/Icon'
import { ADDONS, FEATURES, PACKAGES } from '@/data/catalog'
import {
  DStatus,
  SLOTS,
  isPastDate,
  isTodayDate,
  isPastSlot,
  isExceedingHours,
} from '@/data/schedule'
import { FlowSteps } from '@/features/booking/FlowSteps'
import { resolved, useBooking } from '@/features/booking/booking-state'
import { DAYS, MONTHS, dateLabel, endTime, fmt } from '@/lib/format'
import { occ } from '@/lib/image'
import { Link, navigate } from '@/lib/router'

const BASE_URL = 'http://localhost:4000'

export function VoucherBox() {
  return null
}

const STAT: Record<DStatus, { l: string; cls: string }> = {
  tersedia: { l: 'Tersedia', cls: 'bg-[#e6f2ff] text-brand hover:bg-brand hover:text-white' },
  dibooking: { l: 'Sebagian Terisi', cls: 'bg-[#e6f2ff] text-brand hover:bg-brand hover:text-white' },
  penuh: { l: 'Penuh', cls: 'bg-[#ffe3e3] text-coral line-through cursor-not-allowed opacity-70' },
  lewat: { l: 'Sudah Lewat', cls: 'bg-slate-100 text-slate-300 line-through cursor-not-allowed opacity-40' },
}

const TNC = [
  'Pemesanan dianggap sah setelah bukti pembayaran DP diverifikasi dan di-ACC oleh admin.',
  'Reschedule maksimal 1x dan diajukan paling lambat H-3 sebelum acara, selebihnya dikenakan biaya.',
  'Waktu layanan dihitung sejak photobooth siap digunakan di lokasi acara.',
  'Keterlambatan akses venue akan mengurangi durasi layanan photobooth.',
  'Pelunasan dilakukan sesuai batas waktu yang tertera pada invoice pembayaran.',
  'Dengan melakukan pemesanan, pemesan dianggap telah menyetujui seluruh syarat dan ketentuan yang berlaku.',
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
const L = ({ t, req, children }: { t: string; req?: boolean; children: React.ReactNode }) => (
  <label className="block text-sm font-medium">{t}{req && <Req />}<div className="mt-1.5">{children}</div></label>
)

export function DetailPage() {
  const { b, set } = useBooking()
  const p = PACKAGES[b.pkg] || PACKAGES[1]
  const [slide, setSlide] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [loading, setLoading] = useState(false)

  // 1. Tanggal & Waktu Realtime
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  const currentDay = today.getDate()

  const selectedYear = b.month < currentMonth ? currentYear + 1 : currentYear

  const first = new Date(selectedYear, b.month - 1, 1).getDay()
  const offset = (first + 6) % 7
  const dim = new Date(selectedYear, b.month, 0).getDate()
  const r = resolved(b)

  // 2. Ketersediaan tanggal dari database PostgreSQL
  const [dbMonthStatus, setDbMonthStatus] = useState<Record<string, { status: string; busyRanges?: any[] }>>({})
  const [slotsAvailability, setSlotsAvailability] = useState<Record<string, { available: boolean; reason?: string }>>({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [dbPackages, setDbPackages] = useState<any[]>([])
  const [dbAddons, setDbAddons] = useState<any[]>([])

  // Ambil paket & add-on dari database backend
  useEffect(() => {
    fetch(`${BASE_URL}/api/v1/packages`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data)) {
          setDbPackages(data.data)
        }
      })
      .catch((e) => console.warn('Gagal memuat paket dari server:', e))

    fetch(`${BASE_URL}/api/v1/addons`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data)) {
          setDbAddons(data.data)
        }
      })
      .catch((e) => console.warn('Gagal memuat addon dari server:', e))
  }, [])

  // Fetch status bulan dari backend
  const fetchMonthAvailability = async (year: number, month: number) => {
    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`
      const res = await fetch(`${BASE_URL}/api/v1/availability?month=${monthStr}`)
      const data = await res.json()
      if (res.ok && Array.isArray(data.data)) {
        const map: Record<string, { status: string; busyRanges?: any[] }> = {}
        data.data.forEach((item: any) => {
          map[item.date] = item
        })
        setDbMonthStatus(map)
      }
    } catch (e) {
      console.warn('Gagal memuat status bulan dari database:', e)
    }
  }

  // Fetch slot jam yang tersedia dari backend untuk tanggal & durasi paket terpilih
  const fetchSlotsForDate = async (year: number, month: number, day: number, packageHours: number) => {
    setLoadingSlots(true)
    try {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const res = await fetch(`${BASE_URL}/api/v1/availability/slots?date=${dateStr}&hours=${packageHours}`)
      const data = await res.json()
      if (res.ok && data.data?.slots) {
        const slotMap: Record<string, { available: boolean; reason?: string }> = {}
        data.data.slots.forEach((s: any) => {
          slotMap[s.start] = { available: s.available, reason: s.reason }
        })
        setSlotsAvailability(slotMap)
      }
    } catch (e) {
      console.warn('Gagal memuat ketersediaan slot dari database:', e)
    } finally {
      setLoadingSlots(false)
    }
  }

  useEffect(() => {
    fetchMonthAvailability(selectedYear, b.month)
  }, [selectedYear, b.month])

  useEffect(() => {
    if (b.day) {
      fetchSlotsForDate(selectedYear, b.month, b.day, p?.hours || 2)
    }
  }, [b.day, b.month, selectedYear, p?.hours])

  // Realtime Socket.IO: jika ada booking baru yang masuk atau dikonfirmasi, refresh otomatis
  useEffect(() => {
    const socket = socketIO(BASE_URL, { transports: ['websocket', 'polling'] })
    socket.on('booking:created', () => {
      fetchMonthAvailability(selectedYear, b.month)
      if (b.day) fetchSlotsForDate(selectedYear, b.month, b.day, p?.hours || 2)
    })
    socket.on('payment:confirmed', () => {
      fetchMonthAvailability(selectedYear, b.month)
      if (b.day) fetchSlotsForDate(selectedYear, b.month, b.day, p?.hours || 2)
    })
    return () => {
      socket.disconnect()
    }
  }, [selectedYear, b.month, b.day, p?.hours])

  // Cek status satu tanggal di kalender
  const getDateStatus = (day: number): DStatus => {
    // 1. Cek jika sudah kemarin / lampau
    if (isPastDate(selectedYear, b.month, day)) {
      return 'lewat'
    }

    // 2. Cek status dari database PostgreSQL
    const dateKey = `${selectedYear}-${String(b.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dbItem = dbMonthStatus[dateKey]
    if (dbItem) {
      if (dbItem.status === 'PENUH') return 'penuh'
      if (dbItem.status === 'DIBOOKING') return 'dibooking'
      if (dbItem.status === 'LEWAT') return 'lewat'
    }

    return 'tersedia'
  }

  // Cek ketersediaan slot jam tertentu
  const isSlotAvailable = (slotStr: string): { available: boolean; reason?: string } => {
    if (!b.day) return { available: false, reason: 'Pilih tanggal terlebih dahulu' }

    // 1. Cek jika tanggal kemarin
    if (isPastDate(selectedYear, b.month, b.day)) {
      return { available: false, reason: 'Tanggal sudah berlalu' }
    }

    // 2. Cek jika hari ini & jam sudah lewat
    if (isPastSlot(selectedYear, b.month, b.day, slotStr)) {
      return { available: false, reason: 'Waktu sudah berlalu' }
    }

    // 3. Cek jika durasi melebihi batas jam operasional photobooth (max jam 22.00)
    if (isExceedingHours(slotStr, p?.hours || 2)) {
      return { available: false, reason: 'Melebihi jam operasional (maks 22.00)' }
    }

    // 4. Cek hasil dari database backend
    if (slotsAvailability[slotStr] !== undefined) {
      return slotsAvailability[slotStr]
    }

    return { available: true }
  }

  const ready = b.day && b.time && b.lokasi && b.acara && b.first && b.email && b.wa
  const toggle = (i: number) => set({ addons: b.addons.includes(i) ? b.addons.filter((x) => x !== i) : [...b.addons, i] })
  const missing = [!b.day && 'tanggal', !b.time && 'jam', !(b.acara && b.lokasi) && 'detail event', !(b.first && b.email && b.wa) && 'identitas', !b.agree && 'persetujuan S&K'].filter(Boolean).join(', ')

  const handleBookingSubmit = async () => {
    if (!ready || !b.agree || loading) return
    setLoading(true)

    const cleanWa = b.wa.replace(/[\s-]/g, '')
    const cleanTime = b.time ? (b.time.length === 4 ? `0${b.time}` : b.time) : ''
    
    // Sesuaikan packageId dengan database backend
    let realPackageId = 1
    if (dbPackages.length > 0) {
      const matchByHours = dbPackages.find((pkg) => pkg.hours === p?.hours)
      const matchByIndex = dbPackages[b.pkg]
      realPackageId = (matchByHours || matchByIndex || dbPackages[0]).id
    } else {
      const packageIdMap: Record<number, number> = { 0: 1, 1: 2, 2: 3 }
      realPackageId = packageIdMap[b.pkg] || (b.pkg + 1)
    }

    // Sesuaikan addonId dengan database backend
    const mappedAddons = b.addons.map((addonIdx) => {
      let realAddonId = addonIdx + 1
      if (dbAddons.length > addonIdx) {
        realAddonId = dbAddons[addonIdx].id
      }
      return {
        addonId: realAddonId,
        qty: b.qty[addonIdx] ?? 1,
      }
    })

    const payload = {
      packageId: realPackageId,
      eventDate: `${selectedYear}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`,
      startTime: cleanTime,
      location: b.lokasi,
      eventType: b.jenis || 'Pernikahan',
      eventName: b.acara || null,
      guestCount: b.tamu ? parseInt(b.tamu, 10) : null,
      notes: b.catatan || null,
      customer: {
        name: `${b.first} ${b.last}`.trim(),
        email: b.email,
        whatsapp: cleanWa,
      },
      addons: mappedAddons,
      voucherCode: b.voucher || undefined,
    }

    try {
      const res = await fetch(`${BASE_URL}/api/v1/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (res.ok && result.data) {
        navigate(`/invoice?code=${result.data.code}`)
      } else {
        alert(result.error?.message || result.message || 'Gagal membuat booking. Jam mungkin baru saja dipesan oleh orang lain.')
        // Refresh ketersediaan
        if (b.day) fetchSlotsForDate(selectedYear, b.month, b.day, p?.hours || 2)
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi ke server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="silk-light py-8 md:py-12 pb-32 md:pb-12">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-0">
        <FlowSteps step={1} />
        <Link to="/booking-photobooth" className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-brand">
          <Icon n="left" s={16} /> Ganti paket
        </Link>

        {/* Paket Card */}
        <div className="mt-4 card overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          <div className="relative">
            <div key={slide} className="pop grayscale h-full min-h-[240px] md:min-h-[300px]" style={{ ...occ(slide), aspectRatio: 'auto' }} />
            <button aria-label="Foto sebelumnya" onClick={() => setSlide((slide + 2) % 3)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 grid place-items-center cursor-pointer"><Icon n="left" /></button>
            <button aria-label="Foto berikutnya" onClick={() => setSlide((slide + 1) % 3)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 grid place-items-center cursor-pointer"><Icon n="right" /></button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {[0, 1, 2].map((i) => <span key={i} className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} />)}
            </div>
          </div>
          <div className="p-5 md:p-8 lg:p-10">
            <span className="inline-block px-4 py-1 rounded-lg font-extrabold border-[3px]" style={{ borderColor: p?.color }}>{p?.title}</span>
            <h1 className="mt-4 text-3xl font-extrabold uppercase">Paket Photobooth {p?.title}</h1>
            <div className="mt-2 text-3xl md:text-4xl font-extrabold text-royal">{fmt(p?.price || 0)}</div>
            <ul className="mt-6 space-y-4">
              {FEATURES.map((f) => (
                <li key={f.t} className="flex gap-3 text-sm">
                  <Icon n="check" s={18} className="text-brand mt-0.5 shrink-0" />
                  <span><b>{f.t}</b><br /><span className="text-ink/65">{f.d}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Form Pilihan Tanggal & Jam */}
        <div className="mt-8 md:mt-10 space-y-6 md:space-y-8">
          <p className="text-sm text-ink/70"><span className="text-coral font-bold">*</span> wajib diisi</p>
          <Section n={1} t="Pilih Tanggal & Jam (Realtime Database)">
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 lg:gap-10">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl">{MONTHS[b.month]} {selectedYear}</h3>
                  <div className="flex gap-2">
                    <button
                      disabled={b.month === currentMonth && selectedYear === currentYear}
                      onClick={() => set({ month: b.month === 1 ? 12 : b.month - 1, day: null, time: null })}
                      className="w-11 h-11 rounded-full border border-[#d6e4f5] grid place-items-center disabled:opacity-30 cursor-pointer"
                    >
                      <Icon n="left" s={18} />
                    </button>
                    <button
                      disabled={b.month === (currentMonth + 5) % 12 + 1}
                      onClick={() => set({ month: b.month === 12 ? 1 : b.month + 1, day: null, time: null })}
                      className="w-11 h-11 rounded-full border border-[#d6e4f5] grid place-items-center disabled:opacity-30 cursor-pointer"
                    >
                      <Icon n="right" s={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-ink/50 mb-2">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => <div key={d}>{DAYS[d].slice(0, 3)}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                  {Array.from({ length: offset }).map((_, i) => <div key={'e' + i} />)}
                  {Array.from({ length: dim }).map((_, i) => {
                    const d = i + 1
                    const st = getDateStatus(d)
                    const on = b.day === d
                    const isSelectable = st === 'tersedia' || st === 'dibooking'

                    return (
                      <button
                        key={d}
                        disabled={!isSelectable}
                        onClick={() => {
                          set({ day: d, time: null })
                        }}
                        title={STAT[st].l}
                        aria-pressed={on}
                        className={`h-11 md:h-14 rounded-xl text-sm md:text-base font-semibold transition ${
                          on
                            ? '!bg-brand !text-white ring-4 ring-brand/30 shadow-md font-bold'
                            : STAT[st].cls
                        }`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-5 flex flex-wrap gap-5 text-xs text-ink/70">
                  {(Object.keys(STAT) as DStatus[]).map((k) => (
                    <span key={k} className="flex items-center gap-2">
                      <i
                        className={`w-3 h-3 rounded ${
                          k === 'tersedia'
                            ? 'bg-brand'
                            : k === 'dibooking'
                              ? 'bg-blue-300'
                              : k === 'penuh'
                                ? 'bg-coral'
                                : 'bg-[#c3c7d0]'
                        }`}
                      />
                      {STAT[k].l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Slot Jam */}
              <div className="rounded-2xl bg-[#f6faff] p-4 md:p-6 border border-[#d6e4f5]">
                <h3 className="font-bold text-lg">Jam Tersedia ({p?.title})</h3>
                <div className="mt-3 rounded-xl bg-white border border-[#d6e4f5] p-4 text-sm">
                  <div className="flex items-center gap-2 text-ink/60"><Icon n="cal" s={16} /> Tanggal terpilih<Req /></div>
                  <div className="font-semibold mt-0.5">{b.day ? dateLabel(b.month, b.day) : 'Belum dipilih'}</div>
                  <div className="flex items-center gap-2 text-ink/60 mt-3"><Icon n="clock" s={16} /> Jam terpilih<Req /></div>
                  <div className="font-semibold mt-0.5 text-brand">
                    {b.time ? `${b.time} – ${endTime(b.time, p?.hours || 2)} WIB (${p?.hours || 2} jam)` : 'Belum dipilih'}
                  </div>
                </div>

                {b.day ? (
                  <div>
                    {loadingSlots ? (
                      <div className="py-8 text-center text-xs text-ink/50">Memuat jam yang tersedia dari database...</div>
                    ) : (
                      <div className="pop mt-5 grid grid-cols-3 gap-2.5">
                        {SLOTS.map((s) => {
                          const slotCheck = isSlotAvailable(s)
                          const isAvailable = slotCheck.available
                          const isSelected = b.time === s

                          return (
                            <button
                              key={s}
                              type="button"
                              data-on={isSelected}
                              disabled={!isAvailable}
                              onClick={() => set({ time: s })}
                              title={isAvailable ? `Pilih jam ${s}` : slotCheck.reason || 'Tidak tersedia'}
                              className={`chip !px-0 flex flex-col items-center justify-center h-12 transition ${
                                !isAvailable
                                  ? '!bg-slate-100 !text-slate-400 !border-slate-200 line-through cursor-not-allowed opacity-50'
                                  : isSelected
                                    ? '!bg-brand !text-white !border-brand shadow-sm font-bold'
                                    : 'hover:border-brand hover:text-brand'
                              }`}
                            >
                              <span className="text-sm font-semibold">{s}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <p className="mt-4 text-xs text-ink/60 leading-relaxed">
                      💡 <b>Keterangan:</b> Jika paket <b>{p?.title}</b> dipesan di jam tertentu, maka jam-jam selama sesi tersebut otomatis tidak dapat dipilih (disable) untuk mencegah bentrok jadwal.
                    </p>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-ink/55">Pilih tanggal di kalender untuk melihat jam yang tersedia.</p>
                )}
              </div>
            </div>
          </Section>

          {/* Section Detail Event */}
          <Section n={2} t="Detail Event">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <L t="Nama Acara" req>
                <input className="field" placeholder="cth: Pernikahan Nadia & Raka" value={b.acara} onChange={(e) => set({ acara: e.target.value })} />
              </L>
              <L t="Jenis Acara">
                <select className="field" value={b.jenis} onChange={(e) => set({ jenis: e.target.value })}>
                  <option value="">Pilih jenis acara</option>
                  {['Wedding', 'Corporate', 'Campus', 'School', 'Birthday', 'Festival', 'Lainnya'].map((j) => <option key={j}>{j}</option>)}
                </select>
              </L>
              <div className="md:col-span-2">
                <L t="Lokasi / Alamat Event" req>
                  <input className="field" placeholder="Nama venue, alamat lengkap, kota" value={b.lokasi} onChange={(e) => set({ lokasi: e.target.value })} />
                </L>
              </div>
              <L t="Perkiraan Jumlah Tamu">
                <input type="number" min={1} className="field" placeholder="cth: 200" value={b.tamu} onChange={(e) => set({ tamu: e.target.value })} />
              </L>
              <L t="Catatan">
                <textarea rows={1} className="field" placeholder="Tema, jam setup, kebutuhan khusus…" value={b.catatan} onChange={(e) => set({ catatan: e.target.value })} />
              </L>
            </div>
          </Section>

          {/* Section Identitas Pemesan */}
          <Section n={3} t="Identitas Pemesan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <L t="Nama Depan" req><input className="field" value={b.first} onChange={(e) => set({ first: e.target.value })} /></L>
              <L t="Nama Belakang"><input className="field" value={b.last} onChange={(e) => set({ last: e.target.value })} /></L>
              <L t="Email" req><input type="email" className="field" value={b.email} onChange={(e) => set({ email: e.target.value })} /></L>
              <L t="Nomor WhatsApp" req><input className="field" placeholder="+62" value={b.wa} onChange={(e) => set({ wa: e.target.value })} /></L>
              <div className="md:col-span-2"><L t="Nama Instansi / Organisasi (opsional)"><input className="field" value={b.instansi} onChange={(e) => set({ instansi: e.target.value })} /></L></div>
            </div>
          </Section>

          {/* Section Add On & Submit */}
          <Section n={4} t="Pilih Add On & Booking">
            <div className="grid md:grid-cols-2 gap-3">
              {ADDONS.map(([n, pr], i) => {
                const on = b.addons.includes(i)
                const per = n.includes('(per')
                const q = b.qty[i] ?? 1
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
              <div className="flex justify-between py-2 text-sm"><span className="text-ink/60">Harga Paket Photobooth {p?.title}</span><b>{fmt(p?.price || 0)}</b></div>
              <div className="flex justify-between py-2 text-sm"><span className="text-ink/60">Total Add On ({b.addons.length})</span><b>{fmt(r.addonTotal)}</b></div>
              {r.discount > 0 && <div className="flex justify-between py-2 text-sm text-[#16a34a] font-semibold"><span>Diskon Voucher ({r.voucher})</span><b>-{fmt(r.discount)}</b></div>}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-[#bcd5f2] flex justify-between items-end"><span className="font-extrabold uppercase tracking-wider">Total Harga</span><span className="text-4xl font-extrabold text-royal">{fmt(r.total)}</span></div>
            </div>

            <div className="mt-8 rounded-2xl bg-white border border-[#e3edf9] border-t-[6px] border-t-brand shadow-sm p-5 md:p-7 lg:p-9">
              <h3 className="text-center text-xl font-extrabold uppercase tracking-[.14em]">Syarat dan Ketentuan</h3>
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
            <button disabled={!ready || !b.agree || loading} onClick={handleBookingSubmit} className="hidden md:flex btn btn-primary w-full mt-6 !h-16 text-lg justify-center items-center cursor-pointer">
              {loading ? 'Memproses...' : 'Booking Sekarang'}
            </button>
            {(!ready || !b.agree) && <p className="hidden md:block mt-3 text-xs text-ink/55 text-center">Lengkapi: {missing}.</p>}
          </Section>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#d6e4f5] shadow-[0_-10px_30px_-12px_rgba(26,118,210,.35)] px-4 pt-3 pb-4">
        <button onClick={() => setSheet(true)} className="w-full flex items-center justify-between text-left min-h-[44px]" aria-label="Lihat rincian pesanan">
          <span><span className="block text-xs text-ink/55">Total Harga · lihat rincian</span><span className="text-xl font-extrabold text-royal">{fmt(r.total)}</span></span>
          <span className="w-9 h-9 rounded-full bg-[#e6f2ff] text-brand grid place-items-center"><Icon n="down" s={18} className="rotate-180" /></span>
        </button>
        <button onClick={() => (ready && b.agree ? handleBookingSubmit() : setSheet(true))} disabled={loading} className={`btn btn-primary mt-2 !h-12 w-full ${ready && b.agree ? '' : 'opacity-70'}`}>
          {loading ? 'Memproses...' : 'Booking Sekarang'}
        </button>
      </div>

      {sheet && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setSheet(false)}>
          <div className="pop w-full max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-lg font-extrabold uppercase tracking-wide">Ringkasan Pesanan</h3><button aria-label="Tutup" onClick={() => setSheet(false)} className="w-10 h-10 grid place-items-center rounded-full bg-[#F3F6FB]"><Icon n="x" s={18} /></button></div>
            <dl className="mt-4 space-y-3 text-sm">
              {[['Paket', `Photobooth ${p?.title}`], ['Tanggal', b.day ? dateLabel(b.month, b.day) : '—'], ['Jam', b.time ? `${b.time} – ${endTime(b.time, p?.hours || 2)} WIB` : '—'], ['Lokasi', b.lokasi || '—']].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-ink/55">{k}</dt><dd className="font-semibold text-right break-words min-w-0">{v}</dd></div>
              ))}
            </dl>
            <div className="my-4 border-t-2 border-dashed border-[#d6e4f5]" />
            <div className="flex justify-between text-sm py-1"><span className="text-ink/60">Harga Paket</span><b>{fmt(p?.price || 0)}</b></div>
            <div className="flex justify-between text-sm py-1"><span className="text-ink/60">Total Add On ({b.addons.length})</span><b>{fmt(r.addonTotal)}</b></div>
            {r.discount > 0 && <div className="flex justify-between text-sm py-1 text-[#16a34a] font-semibold"><span>Diskon Voucher ({r.voucher})</span><b>-{fmt(r.discount)}</b></div>}
            <div className="mt-4 pt-4 border-t-2 border-dashed border-[#d6e4f5] flex justify-between items-end"><span className="font-extrabold uppercase text-sm tracking-wider">Total Harga</span><span className="text-3xl font-extrabold text-royal">{fmt(r.total)}</span></div>
            {(!ready || !b.agree) && <p className="mt-4 text-xs text-coral font-medium">Lengkapi dulu: {missing}.</p>}
            <button disabled={!ready || !b.agree || loading} onClick={handleBookingSubmit} className="btn btn-primary mt-4 !h-12 w-full">
              {loading ? 'Memproses...' : 'Booking Sekarang'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
