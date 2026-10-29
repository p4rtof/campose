import { useState } from 'react'
import { A } from './router'
import { Btn, cx, Field, Icon, Input, Logo } from './ui'
import { API } from './store'

function Strip() {
  return (
    <div className="relative mx-auto hidden w-52 rotate-[5deg] rounded-2xl bg-white p-3 shadow-2xl lg:block">
      <span className="absolute -top-3 -left-10 -rotate-12 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand shadow-lg">
        Unlimited print
      </span>
      {[
        ['#6b7280', '#d1d5db'],
        ['#4b5563', '#e5e7eb'],
        ['#374151', '#cbd5e1'],
      ].map(([a, b], i) => (
        <div
          key={i}
          className="mb-2 grid h-24 place-items-end overflow-hidden rounded-lg"
          style={{ background: `linear-gradient(135deg,${b},${a})` }}
        >
          <div className="flex w-full items-end justify-center gap-1">
            {[0, 1, 2].map((j) => (
              <div
                key={j}
                className="rounded-t-full bg-black/45"
                style={{ width: 30 - j * 4, height: 46 - j * 8 }}
              />
            ))}
          </div>
        </div>
      ))}
      <p className="pb-1 text-center text-[10px] font-semibold tracking-[.25em] text-slate-500">
        CAMPOSE · 2026
      </p>
    </div>
  )
}

export default function Login({ onLogin, forgot }: { onLogin: (token: string, admin: any) => void; forgot?: boolean }) {
  const [sent, setSent] = useState(false)
  const view = forgot ? (sent ? 'sent' : 'forgot') : 'login'
  const [email, setEmail] = useState('admin@campose.id')
  const [pw, setPw] = useState('admin123')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [load, setLoad] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setLoad(true)

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      })
      const data = await res.json()

      if (res.ok && data.data?.token) {
        sessionStorage.setItem('campose-auth', '1')
        sessionStorage.setItem('campose-token', data.data.token)
        localStorage.setItem('admin_token', data.data.token)
        onLogin(data.data.token, data.data.admin)
      } else {
        setErr(data.error?.message || 'Email atau password salah')
      }
    } catch {
      setErr('Tidak dapat terhubung ke server backend')
    } finally {
      setLoad(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand to-accent px-6 py-6 text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-14">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 left-10 size-96 rounded-full bg-white/5" />
        <Logo size={34} />
        <div className="relative hidden lg:block">
          <h1 className="max-w-md text-5xl leading-tight font-extrabold tracking-wide uppercase">
            Kelola booking photobooth dengan mudah
          </h1>
          <p className="mt-4 max-w-sm font-light text-white/80">
            Pantau booking, jadwal, dan verifikasi bukti pembayaran event Campose secara realtime.
          </p>
        </div>
        <div className="relative hidden lg:block">
          <Strip />
        </div>
        <p className="relative mt-3 text-sm font-light text-white/90 lg:hidden">
          Kelola booking photobooth dengan mudah
        </p>
        <p className="relative hidden text-xs text-white/60 lg:block">admin.campose.id · © 2026 Campose</p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-sm">
          {view === 'login' && (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">Selamat datang kembali</h2>
                <p className="mt-1 text-sm text-slate-500">Masuk untuk membuka dashboard admin realtime.</p>
              </div>

              {err && (
                <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <Icon n="alert" s={18} />
                  <span>{err}</span>
                </div>
              )}

              <Field label="Email">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@campose.id"
                  className={cx(err && 'border-red-400')}
                />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <Input
                    type={show ? 'text' : 'password'}
                    required
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="Masukkan password"
                    className={cx('pr-12', err && 'border-red-400')}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center text-slate-500 cursor-pointer"
                  >
                    <Icon n={show ? 'eyeoff' : 'eye'} />
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between text-sm">
                <label className="flex min-h-11 items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="size-4 accent-brand cursor-pointer" />
                  Ingat saya
                </label>
                <A to="/admin/lupa-password" className="font-medium text-brand hover:underline">
                  Lupa password?
                </A>
              </div>

              <Btn type="submit" v="primary" full loading={load}>
                {load ? 'Memproses...' : 'Masuk ke Dashboard'}
              </Btn>

              <div className="rounded-xl bg-canvas p-3.5 text-xs text-slate-600 border border-slate-200 flex flex-col gap-1">
                <span className="font-semibold text-ink">Akun Bawaan:</span>
                <span>Email: <b className="text-brand">admin@campose.id</b></span>
                <span>Password: <b className="text-brand">admin123</b></span>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
              }}
              className="space-y-5"
            >
              <A to="/admin" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-slate-600">
                <Icon n="chevL" s={16} />Kembali masuk
              </A>
              <div>
                <h2 className="text-2xl font-bold">Lupa password?</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Masukkan email admin. Password bawaan untuk pengujian adalah <b>admin123</b>.
                </p>
              </div>
              <Field label="Email">
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Btn type="submit" v="primary" full>
                Kirim Link Reset
              </Btn>
            </form>
          )}

          {view === 'sent' && (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Icon n="mail" s={30} />
              </div>
              <h2 className="text-2xl font-bold">Link reset terkirim</h2>
              <p className="text-sm text-slate-500">
                Cek kotak masuk <b className="text-ink">{email}</b>.
              </p>
              <Btn v="primary" full to="/admin">
                Kembali ke Halaman Masuk
              </Btn>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
