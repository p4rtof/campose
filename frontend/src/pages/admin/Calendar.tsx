import { useState } from 'react'
import { Booking, STATUS, PAYCHIP, TODAY, fd, rp, useApp } from './store'
import { Btn, Card, Icon, Modal, PageHead, cx } from './ui'

type Av = 'tersedia' | 'penuh' | 'libur'
const SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
const AV: Record<Av, string> = { tersedia: 'Tersedia', penuh: 'Penuh', libur: 'Libur' }

const overlap = (a: Booking, b: Booking) =>
  a.id !== b.id &&
  a.date === b.date &&
  a.status !== 'dibatalkan' &&
  b.status !== 'dibatalkan' &&
  a.start < b.end &&
  b.start < a.end

// Format nomor WhatsApp untuk URL wa.me
function formatWaUrl(wa: string, text: string) {
  let clean = wa.replace(/[^0-9]/g, '')
  if (clean.startsWith('0')) clean = '62' + clean.slice(1)
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`
}

export default function Calendar() {
  const { bookings, go, toast, availability, setDayAvailability } = useApp()
  const [sel, setSel] = useState<string | null>(TODAY)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'jadwal' | 'atur'>('jadwal')
  const [tmp, setTmp] = useState<Av>('tersedia')
  const [slots, setSlots] = useState<string[]>(SLOTS)
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7 // Monday = 0

  const monthString = String(month + 1).padStart(2, '0')
  const days = [...Array(daysInMonth)].map((_, i) => `${year}-${monthString}-${String(i + 1).padStart(2, '0')}`)
  const cells = [...Array(firstDay)].fill(null).concat(days)

  const clashes = bookings.filter((b) => bookings.some((o) => overlap(b, o)))
  const clashDates = [...new Set(clashes.map((b) => b.date))]
  const on = (d: string) => bookings.filter((b) => b.date === d).sort((a, b) => a.start.localeCompare(b.start))

  const selectedDate = sel || TODAY
  const selectedBookings = on(selectedDate)

  const openDateModal = (d: string, tab: 'jadwal' | 'atur' = 'jadwal') => {
    setSel(d)
    setTmp(availability[d] ?? 'tersedia')
    setSlots(SLOTS)
    setActiveTab(on(d).length > 0 ? tab : 'atur')
    setModalOpen(true)
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  return (
    <div className="space-y-6">
      <PageHead
        title="Kalender & Jadwal Photobooth"
        sub={`${fd(`${year}-${monthString}-01`, { month: 'long', year: 'numeric' })} · Pantau lokasi dan jadwal photobooth secara realtime`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="grid size-10 place-items-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-xs"
              title="Bulan sebelumnya"
            >
              <Icon n="chevL" s={18} />
            </button>
            <span className="font-bold text-sm px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs text-slate-800">
              {fd(`${year}-${monthString}-01`, { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={nextMonth}
              className="grid size-10 place-items-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-xs"
              title="Bulan berikutnya"
            >
              <Icon n="chevR" s={18} />
            </button>
            <Btn
              v="primary"
              icon="plus"
              onClick={() => go('tambah')}
              className="ml-2 !h-10 text-xs md:text-sm font-bold"
            >
              Tambah Booking
            </Btn>
          </div>
        }
      />

      {clashDates.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 shadow-xs" role="alert">
          <Icon n="alert" className="mt-0.5 shrink-0 text-red-600" />
          <div className="flex-1">
            <b>Bentrok jadwal terdeteksi</b> pada {clashDates.map((d) => fd(d, { day: 'numeric', month: 'long' })).join(', ')}: {clashes.map((b) => b.name).join(' dan ')} memakai slot jam yang bertabrakan.
            <button className="ml-2 font-semibold underline text-red-700 hover:text-red-900 cursor-pointer" onClick={() => go('detail', clashes[0].id)}>
              Tinjau Booking
            </button>
          </div>
        </div>
      )}

      {/* Legenda & Filter Bar */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <b className="text-sm text-ink mr-1">Status Hari:</b>
          {[
            ['Tersedia', 'bg-white border-2 border-emerald-400'],
            ['Penuh', 'bg-slate-300'],
            ['Ada Photobooth', 'bg-brand'],
            ['Libur', 'bg-red-200 border border-red-300'],
          ].map(([l, c]) => (
            <span key={l} className="flex items-center gap-2 font-medium">
              <i className={cx('size-3.5 rounded', c)} />
              {l}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500">
          <span className="font-semibold text-slate-700">Status Pembayaran:</span>
          {Object.entries(STATUS).slice(0, 3).map(([k, s]) => (
            <span key={k} className="flex items-center gap-1.5">
              <i className={cx('size-2 rounded-full', s.dot)} />
              {s.label}
            </span>
          ))}
        </div>
      </Card>

      {/* Grid Kalender Desktop */}
      <Card className="hidden overflow-hidden lg:block shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d) => (
            <div key={d} className="py-3.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, idx) => {
            if (!d) {
              return <div key={`empty-${idx}`} className="min-h-36 border-r border-b border-slate-100 bg-slate-50/40" />
            }
            const a = availability[d]
            const bs = on(d)
            const n = Number(d.slice(8))
            const isSelected = sel === d
            const isToday = d === TODAY

            return (
              <div
                key={d}
                onClick={() => setSel(d)}
                onDoubleClick={() => openDateModal(d, bs.length > 0 ? 'jadwal' : 'atur')}
                className={cx(
                  'group relative cursor-pointer border-r border-b border-slate-100 p-2.5 transition min-h-36 flex flex-col justify-between hover:bg-blue-50/40',
                  isSelected && 'ring-2 ring-brand ring-inset bg-blue-50/20',
                  a === 'penuh' && 'bg-slate-100/70',
                  a === 'libur' && 'bg-red-50/60',
                  clashDates.includes(d) && 'bg-red-50/80',
                )}
              >
                {/* Header Tanggal */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={cx(
                        'grid size-7 place-items-center rounded-full text-xs font-bold transition',
                        isToday ? 'bg-brand text-white shadow-xs' : isSelected ? 'bg-slate-800 text-white' : 'text-slate-700 group-hover:bg-slate-200',
                      )}
                    >
                      {n}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {bs.length > 0 && (
                        <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">
                          {bs.length} booth
                        </span>
                      )}
                      {a && (
                        <span className={cx('rounded px-1.5 text-[10px] font-semibold', a === 'penuh' ? 'bg-slate-200 text-slate-700' : 'bg-red-100 text-red-800')}>
                          {AV[a]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Daftar Event Photobooth di Hari Itu */}
                  <div className="space-y-1.5">
                    {bs.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSel(d)
                          openDateModal(d, 'jadwal')
                        }}
                        className={cx(
                          'block w-full rounded-lg border p-1.5 text-left text-[11px] transition shadow-2xs hover:shadow-xs cursor-pointer',
                          STATUS[b.status]?.block || 'bg-blue-50 border-blue-200 text-blue-900',
                          clashes.includes(b) && 'ring-2 ring-red-500',
                        )}
                      >
                        <div className="flex items-center justify-between font-bold leading-tight">
                          <span>{b.start}–{b.end}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-white/80 uppercase font-extrabold">{b.pkg} Jam</span>
                        </div>
                        <div className="font-semibold truncate text-slate-900 mt-0.5">{b.event}</div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-600 truncate mt-0.5">
                          <Icon n="loc" s={11} className="shrink-0 text-brand" />
                          <span className="truncate font-medium">{b.loc}</span>
                        </div>
                      </div>
                    ))}
                    {bs.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openDateModal(d, 'jadwal')
                        }}
                        className="w-full text-center py-1 text-[11px] font-bold text-brand hover:underline"
                      >
                        +{bs.length - 2} photobooth lainnya
                      </button>
                    )}
                  </div>
                </div>

                {/* Tombol Cepat Aksi Tanggal */}
                <div className="pt-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition text-[10px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openDateModal(d, 'jadwal')
                    }}
                    className="text-brand font-semibold hover:underline"
                  >
                    Detail
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openDateModal(d, 'atur')
                    }}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Atur
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* PANEL DETAIL JADWAL LENGKAP HARI TERPILIH (Desktop & Mobile) */}
      <Card className="p-5 md:p-6 shadow-sm border border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-brand" />
              <h2 className="text-lg md:text-xl font-extrabold text-ink">
                Detail Jadwal Photobooth: {fd(selectedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              {selectedBookings.length > 0
                ? `Terdapat ${selectedBookings.length} lokasi photobooth aktif pada hari ini.`
                : 'Tidak ada pesanan photobooth pada hari ini.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Btn
              v="outline"
              icon="cog"
              onClick={() => openDateModal(selectedDate, 'atur')}
              className="!h-9 text-xs"
            >
              Atur Ketersediaan Hari Ini
            </Btn>
            <Btn
              v="primary"
              icon="plus"
              onClick={() => go('tambah')}
              className="!h-9 text-xs"
            >
              Tambah Booking di Hari Ini
            </Btn>
          </div>
        </div>

        {selectedBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <div className="size-16 mx-auto rounded-full bg-slate-100 grid place-items-center text-slate-400">
              <Icon n="calendar" s={28} />
            </div>
            <p className="text-sm font-medium">Belum ada photobooth yang terjadwal di hari ini ({fd(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' })}).</p>
            <div className="flex justify-center gap-3 pt-2">
              <Btn v="outline" onClick={() => openDateModal(selectedDate, 'atur')} className="text-xs !h-9">
                Tandai Libur / Penuh
              </Btn>
              <Btn v="primary" onClick={() => go('tambah')} className="text-xs !h-9">
                + Tambah Booking Manual
              </Btn>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
            {selectedBookings.map((b) => (
              <div
                key={b.id}
                className={cx(
                  'rounded-2xl border p-4.5 transition flex flex-col justify-between shadow-xs hover:shadow-md bg-white',
                  b.pay === 'Lunas' ? 'border-emerald-200 bg-emerald-50/10' : b.pay === 'Bukti Diunggah' ? 'border-purple-300 ring-2 ring-purple-100 bg-purple-50/20' : 'border-slate-200',
                  clashes.includes(b) && 'ring-2 ring-red-500',
                )}
              >
                <div>
                  {/* Jam & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="text-base font-extrabold text-brand flex items-center gap-1.5">
                        <Icon n="clock" s={16} />
                        {b.start} – {b.end} WIB
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">Durasi: Paket {b.pkg} Jam</span>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={cx('inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold', PAYCHIP[b.pay] || 'bg-slate-100 text-slate-700')}>
                        {b.pay}
                      </span>
                    </div>
                  </div>

                  {/* Lokasi Photobooth (Highlight Utama) */}
                  <div className="my-3 rounded-xl bg-blue-50/80 border border-blue-200/80 p-3">
                    <div className="flex items-start gap-2">
                      <Icon n="loc" s={18} className="text-brand shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider block">Lokasi Photobooth:</span>
                        <p className="text-sm font-bold text-slate-900 leading-snug break-words">{b.loc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Acara & Customer */}
                  <div className="space-y-2 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nama / Jenis Acara:</span>
                      <p className="font-bold text-slate-900 text-sm">{b.event}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nama Pemesan:</span>
                        <p className="font-semibold text-slate-800">{b.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">WhatsApp:</span>
                        <a
                          href={formatWaUrl(b.wa, `Halo kak ${b.name}, kami dari tim Campose Photobooth terkait acara ${b.event} pada ${fd(b.date)}.`)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-brand flex items-center gap-1 hover:underline"
                        >
                          <Icon n="wa" s={12} />
                          {b.wa}
                        </a>
                      </div>
                    </div>

                    {b.addons && b.addons.length > 0 && (
                      <div className="pt-1">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Add-on:</span>
                        <p className="text-[11px] text-slate-600 font-medium">{b.addons.join(', ')}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Total Biaya:</span>
                      <span className="text-sm font-extrabold text-brand">{rp(b.totalPrice || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Cepat */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Btn
                    v="outline"
                    full
                    onClick={() => go('detail', b.id)}
                    className="!h-8 text-xs font-semibold"
                  >
                    Detail Booking
                  </Btn>
                  <Btn
                    v="primary"
                    full
                    onClick={() => go('invoice', b.id)}
                    className="!h-8 text-xs font-semibold"
                  >
                    Invoice
                  </Btn>
                  <a
                    href={formatWaUrl(b.wa, `Halo kak ${b.name}, konfirmasi jadwal Campose Photobooth tanggal ${fd(b.date)} pukul ${b.start}-${b.end} WIB di ${b.loc}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="grid size-8 place-items-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition shrink-0"
                    title="Chat Customer di WhatsApp"
                  >
                    <Icon n="wa" s={15} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MODAL DETAIL JADWAL & ATUR KETERSEDIAAN */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={sel ? `Agenda & Pengaturan: ${fd(sel, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
        footer={
          activeTab === 'atur' ? (
            <>
              <Btn full onClick={() => setModalOpen(false)}>Batal</Btn>
              <Btn
                v="primary"
                full
                onClick={async () => {
                  if (sel) {
                    await setDayAvailability(sel, tmp)
                    toast(`Tanggal ${fd(sel)} ditandai ${AV[tmp]}`)
                    setModalOpen(false)
                  }
                }}
              >
                Simpan ke Database
              </Btn>
            </>
          ) : (
            <Btn full onClick={() => setModalOpen(false)}>Tutup</Btn>
          )
        }
      >
        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-5">
          <button
            onClick={() => setActiveTab('jadwal')}
            className={cx(
              'flex-1 py-2.5 text-sm font-bold border-b-2 text-center transition cursor-pointer',
              activeTab === 'jadwal' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            📋 Jadwal Photobooth ({selectedBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('atur')}
            className={cx(
              'flex-1 py-2.5 text-sm font-bold border-b-2 text-center transition cursor-pointer',
              activeTab === 'atur' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            ⚙️ Atur Ketersediaan & Libur
          </button>
        </div>

        {activeTab === 'jadwal' ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {selectedBookings.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <p className="text-sm">Tidak ada photobooth di hari ini.</p>
                <Btn
                  v="primary"
                  onClick={() => {
                    setModalOpen(false)
                    go('tambah')
                  }}
                  className="mt-4 text-xs !h-9"
                >
                  + Buat Booking Manual
                </Btn>
              </div>
            ) : (
              selectedBookings.map((b) => (
                <div key={b.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-brand">{b.start} – {b.end} WIB ({b.pkg} Jam)</span>
                    <span className={cx('rounded-full px-2.5 py-0.5 text-[10px] font-bold', PAYCHIP[b.pay])}>{b.pay}</span>
                  </div>

                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-2.5">
                    <span className="text-[10px] uppercase font-bold text-blue-900 block">Lokasi Photobooth:</span>
                    <span className="text-sm font-bold text-slate-900">{b.loc}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Acara:</span>
                      <span className="font-semibold text-slate-900">{b.event}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Customer:</span>
                      <span className="font-semibold text-slate-900">{b.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">WhatsApp:</span>
                      <a href={formatWaUrl(b.wa, `Halo kak ${b.name}, dari Campose Photobooth...`)} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">
                        {b.wa}
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total:</span>
                      <span className="font-bold text-slate-900">{rp(b.totalPrice || 0)}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Btn full v="outline" onClick={() => { setModalOpen(false); go('detail', b.id); }} className="!h-8 text-xs font-semibold">
                      Buka Detail
                    </Btn>
                    <Btn full v="primary" onClick={() => { setModalOpen(false); go('invoice', b.id); }} className="!h-8 text-xs font-semibold">
                      Invoice
                    </Btn>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium">Status tanggal ini:</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(AV) as Av[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setTmp(k)}
                  className={cx(
                    'min-h-12 rounded-xl border text-sm font-medium transition cursor-pointer',
                    tmp === k ? 'border-brand bg-brand/10 text-brand font-bold' : 'border-slate-300 hover:border-slate-400',
                  )}
                >
                  {AV[k]}
                </button>
              ))}
            </div>

            <p className="mt-5 mb-2 text-sm font-medium">Slot jam yang diaktifkan:</p>
            <div className="grid grid-cols-4 gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  disabled={tmp !== 'tersedia'}
                  onClick={() => setSlots(slots.includes(s) ? slots.filter((x) => x !== s) : [...slots, s])}
                  className={cx(
                    'min-h-10 rounded-lg border text-xs font-semibold disabled:opacity-40 transition cursor-pointer',
                    slots.includes(s) ? 'border-brand bg-brand text-white' : 'border-slate-300 hover:border-slate-400',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {sel && on(sel).length > 0 && (
              <p className="mt-5 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 font-medium">
                ℹ️ Tanggal ini telah memiliki {on(sel).length} booking aktif: {on(sel).map((b) => b.name).join(', ')}.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
