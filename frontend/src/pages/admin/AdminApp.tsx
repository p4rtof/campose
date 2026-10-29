import { useCallback, useEffect, useState } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'
import { BookingNew, Bookings, Detail } from './Bookings'
import Calendar from './Calendar'
import { Invoice, Payments } from './Payments'
import Voucher, { VoucherForm } from './Voucher'
import Settings from './Settings'
import { A, NavCtx, useNav } from './router'
import { Provider, useApp } from './store'
import { Btn, Icon, Logo, cx } from './ui'

const NAV = [
  ['dashboard', 'Dashboard', 'home', '/admin'],
  ['booking', 'Booking', 'list', '/admin/booking'],
  ['calendar', 'Kalender & Jadwal', 'calendar', '/admin/kalender'],
  ['payments', 'Pembayaran & Invoice', 'card', '/admin/pembayaran'],
  ['voucher', 'Voucher', 'ticket', '/admin/voucher'],
  ['settings', 'Pengaturan', 'cog', '/admin/pengaturan'],
]

const BOTTOM = [
  ['dashboard', 'Dashboard', 'home', '/admin'],
  ['booking', 'Booking', 'list', '/admin/booking'],
  ['calendar', 'Kalender', 'calendar', '/admin/kalender'],
  ['payments', 'Pembayaran', 'card', '/admin/pembayaran'],
]

const group = (p: string) =>
  ({ detail: 'booking', tambah: 'booking', invoice: 'payments', voucherForm: 'voucher' } as Record<string, string>)[p] ?? p

function NotFound() {
  return (
    <div className="grid place-items-center py-16 text-center">
      <p className="text-7xl font-extrabold tracking-tight text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Alamat yang Anda buka tidak ada di dashboard admin.
      </p>
      <div className="mt-6">
        <Btn v="primary" icon="home" to="/admin">
          Kembali ke Dashboard
        </Btn>
      </div>
    </div>
  )
}

function Shell({ onLogout }: { onLogout: () => void }) {
  const { route, go, bookings, setQ, q } = useApp()
  const { navigate } = useNav()
  const [drawer, setDrawer] = useState(false)
  const [prof, setProf] = useState(false)
  const [notif, setNotif] = useState(false)
  const [more, setMore] = useState(false)

  const cur = group(route.p)
  const closeAll = () => {
    setDrawer(false)
    setMore(false)
  }

  const Item = ({ p, l, i, to }: { p: string; l: string; i: string; to: string }) => (
    <A
      to={to}
      onClick={closeAll}
      aria-current={cur === p ? 'page' : undefined}
      className={cx(
        'flex min-h-12 w-full items-center justify-start gap-3 rounded-xl px-4 text-left text-sm font-medium whitespace-nowrap transition cursor-pointer',
        cur === p ? 'bg-white text-brand shadow-md font-semibold' : 'text-white/85 hover:bg-white/10',
      )}
    >
      <Icon n={i} s={20} className="shrink-0" />
      <span className="flex-1 text-left">{l}</span>
    </A>
  )

  const Side = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-brand to-accent p-4 text-white">
      <div className="px-2 py-3 flex items-center justify-between">
        <Logo size={28} />
      </div>
      <nav className="mt-6 space-y-1.5">
        {NAV.map(([p, l, i, to]) => (
          <Item key={p} p={p} l={l} i={i} to={to} />
        ))}
      </nav>
      <div className="mt-auto rounded-2xl bg-white/10 p-4 text-xs">
        <div className="flex items-center gap-1.5 mb-1 font-semibold">
          <i className="size-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Realtime Database</span>
        </div>
        <p className="text-white/70">PostgreSQL · Socket.IO Terhubung</p>
      </div>
    </div>
  )

  const pendingProofs = bookings.filter((b) => b.pay === 'Bukti Diunggah')
  const newBookings = bookings.slice(0, 5)

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block shadow-xl">
        <Side />
      </aside>

      {/* Drawer Mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-xs" onClick={() => setDrawer(false)} />
          <div className="pop absolute inset-y-0 left-0 w-72 h-full shadow-2xl">
            <Side />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Buka menu"
            className="grid size-11 place-items-center rounded-xl hover:bg-slate-100 lg:hidden cursor-pointer"
          >
            <Icon n="menu" />
          </button>
          <div className="lg:hidden">
            <Logo dark size={22} />
          </div>

          <div className="relative ml-auto hidden max-w-md flex-1 lg:ml-0 lg:block">
            <Icon n="search" s={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && go('booking')}
              placeholder="Cari booking, invoice, nama customer..."
              className="h-11 w-full rounded-xl bg-canvas pl-10 text-sm outline-none focus:ring-4 focus:ring-brand/15 border border-slate-200"
            />
          </div>

          {/* Notifikasi Popover */}
          <div className="relative ml-auto lg:ml-auto">
            <button
              onClick={() => {
                setNotif(!notif)
                setProf(false)
              }}
              aria-label="Notifikasi"
              className="relative grid size-11 place-items-center rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <Icon n="bell" />
              {pendingProofs.length > 0 && (
                <span className="absolute top-2 right-2 flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-3 bg-red-500 border-2 border-white" />
                </span>
              )}
            </button>
            {notif && (
              <div className="pop absolute right-0 mt-2 w-84 max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 z-50">
                <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100">
                  <p className="text-sm font-bold">Notifikasi Realtime</p>
                  {pendingProofs.length > 0 && (
                    <span className="text-[11px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      {pendingProofs.length} Bukti Bayar
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {pendingProofs.length > 0 && (
                    <div className="p-2">
                      <p className="text-[11px] font-bold text-purple-700 uppercase px-2 mb-1">
                        Perlu Verifikasi Bukti
                      </p>
                      {pendingProofs.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setNotif(false)
                            go('detail', b.id)
                          }}
                          className="block w-full rounded-xl p-2 text-left hover:bg-purple-50 transition cursor-pointer"
                        >
                          <p className="text-xs font-bold text-ink">{b.name} (#{b.inv})</p>
                          <p className="text-[11px] text-purple-600">Bukti pembayaran siap di-ACC</p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="p-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase px-2 mb-1">
                      Booking Terbaru
                    </p>
                    {newBookings.slice(0, 3).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setNotif(false)
                          go('detail', b.id)
                        }}
                        className="block w-full rounded-xl p-2 text-left hover:bg-canvas transition cursor-pointer"
                      >
                        <p className="text-xs font-semibold text-ink">{b.name} · {b.pkg} Jam</p>
                        <p className="text-[11px] text-slate-500">{b.inv} · {b.status}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProf(!prof)
                setNotif(false)
              }}
              className="flex min-h-11 items-center gap-2 rounded-xl px-1.5 hover:bg-slate-100 cursor-pointer"
            >
              <span className="grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white">
                A
              </span>
              <span className="hidden text-left text-sm leading-tight lg:block">
                <b>Admin Campose</b>
                <br />
                <span className="text-xs text-slate-500">Administrator</span>
              </span>
              <Icon n="chevD" s={16} className="hidden lg:block text-slate-400" />
            </button>
            {prof && (
              <div className="pop absolute right-0 mt-2 w-52 rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 z-50">
                <button
                  onClick={() => {
                    setProf(false)
                    navigate('/admin/pengaturan')
                  }}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm hover:bg-canvas cursor-pointer"
                >
                  <Icon n="cog" s={18} /> Pengaturan
                </button>
                <button
                  onClick={onLogout}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Icon n="logout" s={18} /> Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main
          className="mx-auto max-w-[1180px] p-4 pb-28 lg:p-8"
          onClick={() => {
            setProf(false)
            setNotif(false)
          }}
        >
          {route.p === 'dashboard' && <Dashboard />}
          {route.p === 'booking' && <Bookings />}
          {route.p === 'tambah' && <BookingNew />}
          {route.p === 'detail' && <Detail />}
          {route.p === 'calendar' && <Calendar />}
          {route.p === 'payments' && <Payments />}
          {route.p === 'invoice' && <Invoice />}
          {route.p === 'voucher' && <Voucher />}
          {route.p === 'voucherForm' && <VoucherForm key={route.code ?? 'baru'} />}
          {route.p === 'settings' && <Settings />}
          {route.p === 'notfound' && <NotFound />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {BOTTOM.map(([p, l, i, to]) => (
          <A
            key={p}
            to={to}
            onClick={closeAll}
            aria-current={cur === p ? 'page' : undefined}
            className={cx(
              'flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
              cur === p ? 'text-brand font-bold' : 'text-slate-500',
            )}
          >
            <Icon n={i} s={22} />
            {l}
          </A>
        ))}
        <button
          onClick={() => setMore(true)}
          className={cx(
            'flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer',
            ['voucher', 'settings'].includes(cur) ? 'text-brand font-bold' : 'text-slate-500',
          )}
        >
          <Icon n="more" s={22} />
          Lainnya
        </button>
      </nav>

      {/* Mobile Menu Lainnya Bottom Sheet */}
      {more && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/40 lg:hidden" onClick={() => setMore(false)}>
          <div className="pop w-full space-y-2 rounded-t-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 font-bold text-sm">Menu Lainnya</p>
            {[
              ['Voucher Promo', 'ticket', '/admin/voucher'],
              ['Pengaturan Sistem', 'cog', '/admin/pengaturan'],
            ].map(([l, i, to]) => (
              <A
                key={to}
                to={to}
                onClick={closeAll}
                className="flex min-h-12 w-full items-center justify-start gap-3 rounded-xl bg-canvas px-4 text-left text-sm font-medium"
              >
                <Icon n={i} />
                {l}
              </A>
            ))}
            <button
              onClick={onLogout}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <Icon n="logout" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const PUBLIC = ['/admin/login', '/admin/lupa-password']
const clean = (p: string) => p.replace(/\/+$/, '') || '/admin'

export default function AdminApp() {
  const [loc, setLoc] = useState(() => window.location.pathname + window.location.search)
  const [auth, setAuth] = useState(() => {
    return sessionStorage.getItem('campose-auth') === '1' || Boolean(localStorage.getItem('admin_token'))
  })

  const navigate = useCallback((to: string, replace?: boolean) => {
    if (to === window.location.pathname + window.location.search) return
    replace ? history.replaceState(null, '', to) : history.pushState(null, '', to)
    setLoc(to)
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const h = () => setLoc(window.location.pathname + window.location.search)
    window.addEventListener('popstate', h)
    return () => window.removeEventListener('popstate', h)
  }, [])

  const path = clean(loc.split('?')[0])
  const isPublic = PUBLIC.includes(path)

  const login = () => {
    sessionStorage.setItem('campose-auth', '1')
    setAuth(true)
    navigate('/admin', true)
  }

  const logout = () => {
    sessionStorage.removeItem('campose-auth')
    sessionStorage.removeItem('campose-token')
    localStorage.removeItem('admin_token')
    setAuth(false)
    navigate('/admin/login')
  }

  return (
    <NavCtx.Provider value={{ loc, navigate }}>
      {!auth || isPublic ? (
        <Login onLogin={login} forgot={path === '/admin/lupa-password'} />
      ) : (
        <Provider>
          <Shell onLogout={logout} />
        </Provider>
      )}
    </NavCtx.Provider>
  )
}
