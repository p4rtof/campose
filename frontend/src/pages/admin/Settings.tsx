import { useEffect, useRef, useState } from 'react'
import { A } from './router'
import { ADDONS, PKG, TABS, useApp, API } from './store'
import { Btn, Card, Field, Input, Modal, PageHead, Select, cx } from './ui'

export default function Settings() {
  const { toast, route } = useApp()
  const tab = route.tab ?? 'paket'
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('campose-token') || localStorage.getItem('admin_token') || '') : ''

  const [admins, setAdmins] = useState<{ id: number; name: string; email: string; role: string }[]>([])
  const [addAdm, setAddAdm] = useState(false)
  const [na, setNa] = useState({ n: '', e: '', p: '', r: 'ADMIN' })
  const [loading, setLoading] = useState(false)
  const ed = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tab === 'admin' && token) {
      fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setAdmins(data.data)
        })
        .catch(() => {})
    }
  }, [tab, token])

  const save = () => toast('Pengaturan berhasil disimpan ke database', 'ok')
  const cmd = (c: string) => { ed.current?.focus(); document.execCommand(c) }

  const handleCreateAdmin = async () => {
    if (!na.n || !na.e) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: na.n,
          email: na.e,
          password: na.p || 'admin123',
          role: na.r,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAdmins((prev) => [data.data, ...prev])
        toast(`Admin ${na.n} berhasil ditambahkan! Password default: admin123`, 'ok')
        setAddAdm(false)
        setNa({ n: '', e: '', p: '', r: 'ADMIN' })
      } else {
        toast(data.error?.message || 'Gagal menambahkan admin', 'err')
      }
    } catch {
      toast('Terjadi kesalahan', 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHead title="Pengaturan Sistem" sub="Atur paket harga, add-on, syarat & ketentuan, serta akun admin" />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(([k, t]) => (
          <A
            key={k}
            to={'/admin/pengaturan?tab=' + k}
            aria-current={tab === k ? 'page' : undefined}
            className={cx(
              'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition cursor-pointer',
              tab === k ? 'bg-brand text-white shadow' : 'bg-white text-slate-600 shadow-card hover:bg-slate-50',
            )}
          >
            {t}
          </A>
        ))}
      </div>

      <Card className="max-w-3xl p-5 md:p-7">
        {tab === 'paket' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-base">Harga Paket Photobooth</h2>
            {([2, 4, 8] as const).map((n) => (
              <div key={n} className="grid grid-cols-[1fr_1.5fr] items-center gap-3">
                <span className="font-medium text-sm">Paket {n} Jam</span>
                <Input defaultValue={PKG[n]} type="number" aria-label={`Harga paket ${n} jam`} />
              </div>
            ))}
            <h2 className="pt-4 font-semibold text-base">Kontak WhatsApp Admin</h2>
            <Field label="Nomor WhatsApp CS" hint="Ditampilkan pada invoice dan tombol chat WhatsApp customer.">
              <Input defaultValue="+62 821-2477-8747" inputMode="tel" />
            </Field>
            <Btn v="primary" full onClick={save} className="mt-2">
              Simpan Pengaturan
            </Btn>
          </div>
        )}

        {tab === 'add-on' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-base">Daftar Add-on Photobooth</h2>
            {Object.entries(ADDONS).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[1.5fr_1fr] items-center gap-3">
                <span className="text-sm font-medium">{k}</span>
                <Input defaultValue={v} type="number" aria-label={`Harga ${k}`} />
              </div>
            ))}
            <Btn icon="plus" full onClick={() => toast('Fitur tambah add-on baru')}>
              Tambah Add-on
            </Btn>
            <Btn v="primary" full onClick={save} className="mt-2">
              Simpan Add-on
            </Btn>
          </div>
        )}

        {tab === 'syarat' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-base">Syarat dan Ketentuan Layanan</h2>
            <div className="flex gap-1">
              {[
                ['B', 'bold'],
                ['I', 'italic'],
                ['• Daftar', 'insertUnorderedList'],
              ].map(([l, c]) => (
                <button
                  key={c}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    cmd(c)
                  }}
                  className="min-h-11 min-w-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {l}
                </button>
              ))}
            </div>
            <div
              ref={ed}
              contentEditable
              suppressContentEditableWarning
              className="min-h-48 rounded-xl border border-slate-300 p-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15 leading-relaxed"
            >
              <ul className="list-disc pl-5 space-y-1">
                <li>Pemesanan dianggap sah setelah bukti pembayaran DP diverifikasi oleh admin.</li>
                <li>Reschedule maksimal 1x dan diajukan paling lambat H-3 sebelum acara.</li>
                <li>Waktu layanan dihitung sejak photobooth siap digunakan di lokasi acara.</li>
                <li>Keterlambatan akses venue akan mengurangi durasi layanan photobooth.</li>
              </ul>
            </div>
            <Btn v="primary" full onClick={save} className="mt-2">
              Simpan Syarat & Ketentuan
            </Btn>
          </div>
        )}

        {tab === 'admin' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base">Akun Administrator</h2>
                <p className="text-xs text-slate-500">Daftar pengguna dengan akses ke dashboard ini</p>
              </div>
              <Btn icon="plus" onClick={() => setAddAdm(true)}>
                Tambah Admin
              </Btn>
            </div>

            <div className="space-y-2">
              {admins.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">Memuat daftar admin...</div>
              ) : (
                admins.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-xl bg-canvas p-3">
                    <span className="grid size-10 place-items-center rounded-full bg-brand text-sm font-semibold text-white">
                      {u.name[0] || 'A'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                    <span
                      className={cx(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        u.role === 'OWNER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800',
                      )}
                    >
                      {u.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={addAdm}
        onClose={() => setAddAdm(false)}
        title="Tambah Akun Admin Baru"
        footer={
          <>
            <Btn full onClick={() => setAddAdm(false)}>Batal</Btn>
            <Btn v="primary" full loading={loading} disabled={!na.n || !na.e} onClick={handleCreateAdmin}>
              Buat Akun Admin
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nama Lengkap">
            <Input value={na.n} onChange={(e) => setNa({ ...na, n: e.target.value })} placeholder="Contoh: Salsa Amelia" />
          </Field>
          <Field label="Alamat Email">
            <Input type="email" value={na.e} onChange={(e) => setNa({ ...na, e: e.target.value })} placeholder="salsa@campose.id" />
          </Field>
          <Field label="Password Akun (Default: admin123)">
            <Input
              type="password"
              value={na.p}
              onChange={(e) => setNa({ ...na, p: e.target.value })}
              placeholder="Kosongkan untuk default admin123"
            />
          </Field>
          <Field label="Peran / Role">
            <Select value={na.r} onChange={(e) => setNa({ ...na, r: e.target.value })}>
              <option value="ADMIN">ADMIN</option>
              <option value="OWNER">OWNER</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
