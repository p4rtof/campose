import { useState, useEffect, useRef } from 'react'
import { io as socketIO } from 'socket.io-client'
import { fmt } from '@/lib/format'
import { navigate } from '@/lib/router'

const BASE_URL = 'http://localhost:4000'
const API = `${BASE_URL}/api/v1/admin`

// ── Types ──────────────────────────────────────────────────
type AdminInfo = { id: number; name: string; email: string; role: string }
type PaymentStatus = 'PENDING' | 'MENUNGGU_KONFIRMASI' | 'PAID' | 'EXPIRED' | 'FAILED' | 'DITOLAK'
type BookingStatus = 'MENUNGGU_PEMBAYARAN' | 'TERKONFIRMASI' | 'SELESAI' | 'DIBATALKAN'

type Payment = {
  id: string; status: PaymentStatus; amount: number; method: string
  paymentProofUrl: string | null; uploadedAt: string | null; adminNote: string | null
  paidAt: string | null; createdAt: string
}
type Booking = {
  id: string; code: string; status: BookingStatus; customerName: string
  email: string; whatsapp: string; eventDate: string; startTime: string
  endTime: string; location: string; eventType: string; total: number
  package: { name: string }; payments: Payment[]; createdAt: string
}
type Stats = { totalBookings: number; pendingProof: number; confirmed: number; totalRevenue: number }

// ── Helper ─────────────────────────────────────────────────
const statusLabel: Record<PaymentStatus, { l: string; cls: string }> = {
  PENDING: { l: 'Belum Bayar', cls: 'bg-gray-100 text-gray-600' },
  MENUNGGU_KONFIRMASI: { l: 'Bukti Diunggah', cls: 'bg-yellow-100 text-yellow-700' },
  PAID: { l: 'Lunas', cls: 'bg-green-100 text-green-700' },
  EXPIRED: { l: 'Kadaluwarsa', cls: 'bg-red-100 text-red-500' },
  FAILED: { l: 'Gagal', cls: 'bg-red-100 text-red-600' },
  DITOLAK: { l: 'Ditolak', cls: 'bg-red-200 text-red-700' },
}
const bookingStatusLabel: Record<BookingStatus, { l: string; cls: string }> = {
  MENUNGGU_PEMBAYARAN: { l: 'Menunggu Bayar', cls: 'bg-yellow-100 text-yellow-700' },
  TERKONFIRMASI: { l: 'Dikonfirmasi', cls: 'bg-green-100 text-green-700' },
  SELESAI: { l: 'Selesai', cls: 'bg-blue-100 text-blue-700' },
  DIBATALKAN: { l: 'Dibatalkan', cls: 'bg-gray-100 text-gray-500' },
}
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtDateTime = (d: string) => new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
function authHeaders(token: string) { return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }

// ── Login Page ─────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (token: string, admin: AdminInfo) => void }) {
  const [email, setEmail] = useState('admin@campose.id')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.data?.token) {
        localStorage.setItem('admin_token', data.data.token)
        onLogin(data.data.token, data.data.admin)
      } else {
        setError(data.error?.message || 'Login gagal')
      }
    } catch {
      setError('Tidak dapat terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A76D2]/10 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand grid place-items-center mx-auto text-white text-2xl font-extrabold">C</div>
          <h1 className="mt-4 text-2xl font-extrabold">Admin Campose</h1>
          <p className="text-sm text-ink/55 mt-1">Dashboard Manajemen Booking</p>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
        <div className="mb-5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
          <div>
            <p className="font-semibold">Akun Bawaan:</p>
            <p>Email: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-100">admin@campose.id</code></p>
            <p className="mt-0.5">Password: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-100">admin123</code></p>
          </div>
          <button
            type="button"
            onClick={() => { setEmail('admin@campose.id'); setPassword('admin123') }}
            className="text-xs bg-brand text-white px-2.5 py-1.5 rounded-lg hover:bg-brand/90 font-medium"
          >
            Isi Otomatis
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-[#d6e4f5] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-[#d6e4f5] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" required />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full !h-12 font-bold justify-center">
            {loading ? 'Masuk...' : 'Masuk ke Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-[#e8f0fb]">
      <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${color ?? 'text-ink'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/50">{sub}</p>}
    </div>
  )
}

// ── Proof Image Modal ──────────────────────────────────────
function ProofModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <img src={`${BASE_URL}${url}`} alt="Bukti Pembayaran" className="w-full rounded-2xl object-contain max-h-[80vh]" />
        <button onClick={onClose} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white grid place-items-center text-ink shadow">✕</button>
      </div>
    </div>
  )
}

// ── Booking Detail Modal ───────────────────────────────────
function BookingDetailModal({ booking, token, onClose, onRefresh }: {
  booking: Booking; token: string; onClose: () => void; onRefresh: () => void
}) {
  const latestPayment = booking.payments[0] ?? null
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null)
  const [showProof, setShowProof] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t) } }, [toast])

  const handleConfirm = async () => {
    if (!latestPayment) return
    setLoading('confirm')
    try {
      const res = await fetch(`${API}/payments/${latestPayment.id}/confirm`, {
        method: 'POST', headers: authHeaders(token), body: JSON.stringify({ adminNote: note }),
      })
      const data = await res.json()
      if (res.ok) { setToast('✅ Pembayaran dikonfirmasi!'); onRefresh(); onClose() }
      else setToast(data.error?.message || 'Gagal')
    } finally { setLoading(null) }
  }

  const handleReject = async () => {
    if (!latestPayment || !note.trim()) { setToast('Isi alasan penolakan terlebih dahulu'); return }
    setLoading('reject')
    try {
      const res = await fetch(`${API}/payments/${latestPayment.id}/reject`, {
        method: 'POST', headers: authHeaders(token), body: JSON.stringify({ adminNote: note }),
      })
      const data = await res.json()
      if (res.ok) { setToast('❌ Pembayaran ditolak'); onRefresh(); onClose() }
      else setToast(data.error?.message || 'Gagal')
    } finally { setLoading(null) }
  }

  const pStatus = latestPayment?.status as PaymentStatus | undefined

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e8f0fb]">
          <div>
            <h2 className="text-xl font-extrabold">#{booking.code}</h2>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${bookingStatusLabel[booking.status].cls}`}>
              {bookingStatusLabel[booking.status].l}
            </span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#f0f4fb] grid place-items-center text-ink">✕</button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Info customer */}
          <div>
            <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-3">Data Pemesan</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Nama', booking.customerName], ['Email', booking.email],
                ['WhatsApp', booking.whatsapp], ['Paket', booking.package.name],
                ['Tanggal', fmtDate(booking.eventDate)], ['Jam', `${booking.startTime} – ${booking.endTime}`],
                ['Lokasi', booking.location], ['Jenis Acara', booking.eventType],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-ink/50">{k}</p>
                  <p className="font-semibold break-words">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#e8f0fb] flex justify-between">
              <span className="font-bold text-sm">Total</span>
              <span className="font-extrabold text-xl text-royal">{fmt(booking.total)}</span>
            </div>
          </div>

          {/* Payment info */}
          {latestPayment && (
            <div>
              <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-3">Pembayaran</h3>
              <div className="rounded-2xl border border-[#e8f0fb] p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink/55">Status</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${pStatus ? statusLabel[pStatus].cls : ''}`}>
                    {pStatus ? statusLabel[pStatus].l : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink/55">Metode</span><span className="font-semibold">{latestPayment.method}</span>
                </div>
                {latestPayment.uploadedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/55">Diunggah</span><span className="font-semibold">{fmtDateTime(latestPayment.uploadedAt)}</span>
                  </div>
                )}
                {latestPayment.adminNote && (
                  <div className="text-sm">
                    <span className="text-ink/55">Catatan Admin: </span>
                    <span className="font-semibold">{latestPayment.adminNote}</span>
                  </div>
                )}

                {/* Bukti bayar */}
                {latestPayment.paymentProofUrl && (
                  <div>
                    <p className="text-xs text-ink/55 mb-2">Bukti Pembayaran:</p>
                    <img
                      src={`${BASE_URL}${latestPayment.paymentProofUrl}`}
                      alt="Bukti"
                      className="w-full max-h-48 object-cover rounded-xl cursor-pointer hover:opacity-90 transition border border-[#e8f0fb]"
                      onClick={() => setShowProof(true)}
                    />
                    <button onClick={() => setShowProof(true)} className="mt-1 text-xs text-brand underline">Lihat gambar penuh</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action untuk MENUNGGU_KONFIRMASI */}
          {pStatus === 'MENUNGGU_KONFIRMASI' && (
            <div>
              <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-3">Tindakan Admin</h3>
              <textarea
                className="w-full rounded-xl border border-[#d6e4f5] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                rows={2}
                placeholder="Catatan admin (wajib isi jika menolak)"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleConfirm}
                  disabled={loading !== null}
                  className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition disabled:opacity-50"
                >
                  {loading === 'confirm' ? 'Memproses...' : '✅ Konfirmasi Lunas'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading !== null}
                  className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition disabled:opacity-50"
                >
                  {loading === 'reject' ? 'Memproses...' : '❌ Tolak'}
                </button>
              </div>
            </div>
          )}
        </div>

        {toast && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ink text-white px-5 py-2 rounded-full text-sm">{toast}</div>}
      </div>
      {showProof && latestPayment?.paymentProofUrl && <ProofModal url={latestPayment.paymentProofUrl} onClose={() => setShowProof(false)} />}
    </div>
  )
}

// ── Main Admin Dashboard ───────────────────────────────────
export function AdminPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'))
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<string[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const socketRef = useRef<ReturnType<typeof socketIO> | null>(null)

  const handleLogin = (t: string, a: AdminInfo) => { setToken(t); setAdmin(a) }
  const handleLogout = () => { localStorage.removeItem('admin_token'); setToken(null); setAdmin(null) }

  // Setup Socket.IO
  useEffect(() => {
    if (!token) return
    const socket = socketIO(BASE_URL, { transports: ['websocket'] })
    socketRef.current = socket

    socket.emit('admin:join', token)
    socket.on('admin:joined', () => console.log('Socket: joined admin room'))

    socket.on('payment:proof_uploaded', (data: any) => {
      setNotifications(n => [`📸 Bukti bayar baru dari ${data.customerName} (${data.bookingCode})`, ...n.slice(0, 9)])
      setPendingCount(c => c + 1)
      fetchBookings()
    })
    socket.on('payment:confirmed', (data: any) => {
      setNotifications(n => [`✅ Pembayaran ${data.bookingCode} dikonfirmasi`, ...n.slice(0, 9)])
      fetchStats()
      fetchBookings()
    })
    socket.on('payment:rejected', (data: any) => {
      setNotifications(n => [`❌ Pembayaran ${data.bookingCode} ditolak`, ...n.slice(0, 9)])
      fetchBookings()
    })

    return () => { socket.disconnect() }
  }, [token])

  const fetchStats = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/stats`, { headers: authHeaders(token) })
      const data = await res.json()
      if (res.ok) { setStats(data.data); setPendingCount(data.data.pendingProof) }
      else if (res.status === 401) handleLogout()
    } catch {}
  }

  const fetchBookings = async (p = page, status = statusFilter) => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '15' })
      if (status) params.set('status', status)
      const res = await fetch(`${API}/bookings?${params}`, { headers: authHeaders(token) })
      const data = await res.json()
      if (res.ok) { setBookings(data.data.items); setTotal(data.data.total) }
      else if (res.status === 401) handleLogout()
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (token) { fetchStats(); fetchBookings() }
  }, [token, page, statusFilter])

  if (!token) return <LoginPage onLogin={handleLogin} />

  const LIMIT = 15
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Topbar */}
      <header className="bg-brand text-white px-5 md:px-8 h-16 flex items-center justify-between sticky top-0 z-30 shadow">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 grid place-items-center font-extrabold text-sm">C</div>
          <span className="font-bold hidden md:block">Campose Admin</span>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {pendingCount} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {admin && <span className="text-sm text-white/80 hidden md:block">{admin.name}</span>}
          <button onClick={handleLogout} className="text-sm bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-lg transition">Keluar</button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Booking" value={stats.totalBookings} />
            <StatCard label="Menunggu Konfirmasi" value={stats.pendingProof} color="text-yellow-600" sub="Bukti sudah diunggah" />
            <StatCard label="Dikonfirmasi" value={stats.confirmed} color="text-green-600" />
            <StatCard label="Total Revenue" value={fmt(stats.totalRevenue)} color="text-royal" />
          </div>
        )}

        {/* Notifikasi realtime */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e8f0fb]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">🔔 Notifikasi Terbaru</h3>
              <button onClick={() => setNotifications([])} className="text-xs text-ink/50 hover:text-ink">Hapus semua</button>
            </div>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {notifications.map((n, i) => (
                <li key={i} className="text-sm text-ink/70 py-1 border-b border-[#f0f4fb] last:border-0">{n}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Booking list */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8f0fb] overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-6 border-b border-[#e8f0fb]">
            <h2 className="font-extrabold text-lg">Daftar Booking ({total})</h2>
            <div className="flex gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="h-10 px-3 rounded-xl border border-[#d6e4f5] text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                <option value="">Semua Status</option>
                <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
                <option value="TERKONFIRMASI">Dikonfirmasi</option>
                <option value="SELESAI">Selesai</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </select>
              <button onClick={() => fetchBookings()} className="h-10 px-4 rounded-xl border border-[#d6e4f5] text-sm hover:bg-[#f0f4fb] transition">
                ↻ Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-ink/50">Memuat data...</div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-ink/50">Tidak ada booking ditemukan</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8fafd] text-xs text-ink/50 uppercase tracking-wider">
                    <th className="text-left px-4 md:px-6 py-3 font-semibold">Invoice</th>
                    <th className="text-left px-4 py-3 font-semibold">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Paket</th>
                    <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Tanggal Event</th>
                    <th className="text-right px-4 py-3 font-semibold">Total</th>
                    <th className="text-center px-4 py-3 font-semibold">Status Booking</th>
                    <th className="text-center px-4 py-3 font-semibold">Status Bayar</th>
                    <th className="text-center px-4 md:px-6 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4fb]">
                  {bookings.map(b => {
                    const lp = b.payments[0]
                    const ps = lp?.status as PaymentStatus | undefined
                    const isPending = ps === 'MENUNGGU_KONFIRMASI'
                    return (
                      <tr key={b.id} className={`hover:bg-[#f8fafd] transition ${isPending ? 'bg-yellow-50' : ''}`}>
                        <td className="px-4 md:px-6 py-3.5 font-bold text-brand">
                          {b.code}
                          {isPending && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Perlu Aksi</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold">{b.customerName}</div>
                          <div className="text-xs text-ink/50">{b.email}</div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-ink/70">{b.package.name}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-ink/70">{fmtDate(b.eventDate)}</td>
                        <td className="px-4 py-3.5 text-right font-bold">{fmt(b.total)}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${bookingStatusLabel[b.status].cls}`}>
                            {bookingStatusLabel[b.status].l}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {ps ? (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusLabel[ps].cls}`}>
                              {statusLabel[ps].l}
                            </span>
                          ) : <span className="text-xs text-ink/40">—</span>}
                        </td>
                        <td className="px-4 md:px-6 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="h-8 px-3 rounded-lg bg-brand/10 text-brand hover:bg-brand hover:text-white font-semibold text-xs transition"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 md:p-6 border-t border-[#e8f0fb]">
              <p className="text-sm text-ink/50">Halaman {page} dari {totalPages}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-9 px-4 rounded-xl border border-[#d6e4f5] text-sm disabled:opacity-40 hover:bg-[#f0f4fb] transition">← Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-9 px-4 rounded-xl border border-[#d6e4f5] text-sm disabled:opacity-40 hover:bg-[#f0f4fb] transition">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          token={token}
          onClose={() => setSelectedBooking(null)}
          onRefresh={() => { fetchStats(); fetchBookings() }}
        />
      )}
    </div>
  )
}
