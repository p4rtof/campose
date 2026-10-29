import { Badge, price, rp, fd, TODAY, useApp } from './store'
import { Card, Icon, Skel } from './ui'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function LineChart({ bookings }: { bookings: any[] }) {
  const W = 600, H = 220, p = 28, max = Math.max(10, Math.ceil(bookings.length / 5) * 5)
  // Hitung jumlah booking per bulan tahun ini
  const curYear = new Date().getFullYear()
  const monthlyCounts = Array(12).fill(0)
  bookings.forEach((b) => {
    if (b.date && b.date.startsWith(String(curYear))) {
      const m = parseInt(b.date.slice(5, 7), 10) - 1
      if (m >= 0 && m < 12) monthlyCounts[m]++
    }
  })

  const pts = monthlyCounts.map((v, i) => [p + (i * (W - p * 2)) / 11, H - p - (v / max) * (H - p * 2)])
  const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0] + ' ' + q[1]).join(' ')
  const curMonth = new Date().getMonth()

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Grafik booking per bulan">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1A76D2" stopOpacity=".25" />
          <stop offset="1" stopColor="#1A76D2" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, Math.round(max / 2), max].map((v) => {
        const y = H - p - (v / max) * (H - p * 2)
        return (
          <g key={v}>
            <line x1={p} x2={W - p} y1={y} y2={y} stroke="#E6ECF5" />
            <text x="0" y={y + 4} fontSize="10" fill="#94a3b8">{v}</text>
          </g>
        )
      })}
      <path d={`${d} L${pts[11][0]} ${H - p} L${pts[0][0]} ${H - p} Z`} fill="url(#g)" />
      <path d={d} fill="none" stroke="#1A76D2" strokeWidth="3" strokeLinejoin="round" />
      {pts.map((q, i) => (
        <g key={i}>
          <circle cx={q[0]} cy={q[1]} r={i === curMonth ? 5 : 3} fill="#fff" stroke="#1F4FBF" strokeWidth="2" />
          <text x={q[0]} y={H - 8} textAnchor="middle" fontSize="10" fill={i === curMonth ? '#1A76D2' : '#64748b'} fontWeight={i === curMonth ? 'bold' : 'normal'}>
            {months[i]}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Donut({ data }: { data: { l: string; v: number; c: string }[] }) {
  const tot = data.reduce((s, d) => s + d.v, 0) || 1
  let acc = 0
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 42 42" className="size-36 -rotate-90 shrink-0" role="img" aria-label="Proporsi paket">
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="#E6ECF5" strokeWidth="6" />
        {data.map((d) => {
          const len = (d.v / tot) * 100
          const el = (
            <circle
              key={d.l}
              cx="21"
              cy="21"
              r="15.9"
              fill="none"
              stroke={d.c}
              strokeWidth="6"
              strokeDasharray={`${Math.max(0, len - 1)} ${Math.max(0, 101 - len)}`}
              strokeDashoffset={-acc}
            />
          )
          acc += len
          return el
        })}
      </svg>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.l} className="flex items-center gap-2">
            <i className="size-3 rounded-full" style={{ background: d.c }} />
            {d.l}
            <b className="ml-auto pl-3">{Math.round((d.v / tot) * 100)}%</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Dashboard() {
  const { bookings, go, stats: realStats } = useApp()
  const act = bookings.filter((b) => b.status !== 'dibatalkan')
  const curMonthPrefix = TODAY.slice(0, 7) // '2026-10'
  const thisMonthBookings = bookings.filter((b) => b.date && b.date.startsWith(curMonthPrefix))
  
  const rev = realStats?.totalRevenue ?? bookings
    .filter((b) => b.pay === 'Lunas')
    .reduce((s, b) => s + price(b).total, 0)

  const pendingProofCount = bookings.filter((b) => b.pay === 'Bukti Diunggah').length

  const statsCards = [
    {
      l: 'Total Booking',
      v: bookings.length,
      i: 'list',
      c: 'bg-blue-100 text-brand',
      to: 'booking',
      sub: `${thisMonthBookings.length} bulan ini`,
    },
    {
      l: 'Menunggu ACC Bukti',
      v: pendingProofCount,
      i: 'clock',
      c: pendingProofCount > 0 ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-400 animate-pulse' : 'bg-amber-100 text-amber-600',
      to: 'booking',
      sub: `${bookings.filter((b) => b.status === 'menunggu').length} total belum lunas`,
    },
    {
      l: 'Event Terkonfirmasi',
      v: bookings.filter((b) => b.status === 'terkonfirmasi').length,
      i: 'check',
      c: 'bg-emerald-100 text-emerald-600',
      to: 'calendar',
      sub: 'Siap dilaksanakan',
    },
    {
      l: 'Total Pendapatan',
      v: rp(rev),
      i: 'card',
      c: 'bg-purple-100 text-purple-600',
      to: 'payments',
      sub: 'Lunas terkonfirmasi',
    },
  ]

  // Event 7 hari ke depan
  const next7Days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const upcoming = act
    .filter((b) => b.date >= TODAY && b.date <= next7Days)
    .sort((a, b) => a.date.localeCompare(b.date))

  const pk = [2, 4, 8].map((n, i) => ({
    l: `Paket ${n} Jam`,
    v: act.filter((b) => b.pkg === n).length,
    c: ['#1A76D2', '#C26AE8', '#FF5FBF'][i],
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-[28px]">Halo, Admin Campose</h1>
        <p className="text-sm text-slate-500">
          Ringkasan operasional realtime per {fd(TODAY, { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-5">
        {statsCards.map((s) => (
          <button
            key={s.l}
            onClick={() => go(s.to)}
            className="rounded-2xl bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 md:p-5 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className={`grid size-10 place-items-center rounded-xl ${s.c}`}>
                <Icon n={s.i} />
              </span>
              {s.l === 'Menunggu ACC Bukti' && pendingProofCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  PERLU AKSI
                </span>
              )}
            </div>
            <p className="mt-3 text-xl font-bold md:text-2xl">{s.v}</p>
            <p className="text-xs text-slate-500 md:text-sm">{s.l}</p>
            {s.sub && <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h2 className="mb-2 font-semibold">Statistik Booking ({new Date().getFullYear()})</h2>
          <LineChart bookings={bookings} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Proporsi Paket Terjual</h2>
          <Donut data={pk} />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              Event Mendatang <span className="text-xs font-normal text-slate-500">7 hari ke depan</span>
            </h2>
            <button onClick={() => go('calendar')} className="text-sm font-medium text-brand cursor-pointer">
              Kalender
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Tidak ada event dalam 7 hari ke depan.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => go('detail', b.id)}
                    className="flex min-h-14 w-full items-center gap-3 py-3 text-left cursor-pointer"
                  >
                    <div className="w-12 shrink-0 rounded-xl bg-canvas py-1 text-center">
                      <p className="text-[10px] uppercase text-slate-500">{fd(b.date, { month: 'short' })}</p>
                      <p className="font-bold leading-none">{b.date.slice(8)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.event}</p>
                      <p className="truncate text-xs text-slate-500">
                        {b.start}–{b.end} · {b.loc}
                      </p>
                    </div>
                    <Badge s={b.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Booking Terbaru</h2>
            <button onClick={() => go('booking')} className="text-sm font-medium text-brand cursor-pointer">
              Lihat semua
            </button>
          </div>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Belum ada booking.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {bookings.slice(0, 5).map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => go('detail', b.id)}
                    className="flex min-h-14 w-full items-center gap-3 py-3 text-left cursor-pointer"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                      {b.name[0] || 'C'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-slate-500">
                        {b.inv} · {b.pkg} Jam
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{rp(price(b).total)}</p>
                      <span className="text-[11px] text-slate-400">{b.pay}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">
            Status Integrasi Realtime <span className="text-xs font-normal text-slate-500">Live Database</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <i className="size-2 rounded-full bg-emerald-500 animate-ping" /> Terhubung (Socket.IO)
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['database', 'Koneksi PostgreSQL', 'campose_db', 'Aktif'],
            ['bell', 'Notifikasi Bukti Bayar', `${pendingProofCount} Menunggu ACC`, pendingProofCount > 0 ? 'Perhatian' : 'OK'],
            ['calendar', 'Bulan Aktif', fd(TODAY, { month: 'long', year: 'numeric' }), 'Live'],
          ].map(([i, l, v, d]) => (
            <div key={l} className="flex items-center gap-3 rounded-xl bg-canvas p-4">
              <span className="grid size-10 place-items-center rounded-lg bg-white text-brand shadow-sm">
                <Icon n={i} />
              </span>
              <div>
                <p className="text-xs text-slate-500">{l}</p>
                <p className="font-bold text-sm">
                  {v} <span className="text-xs font-medium text-emerald-600">({d})</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
export const DashSkeleton = () => <div className="space-y-4"><Skel className="h-24" /><Skel className="h-24" /></div>
