import { useEffect, useRef, useState } from 'react'
import { A } from './router'
import { TABS, useApp, API } from './store'
import { Btn, Card, Field, Input, Modal, PageHead, Select, cx } from './ui'

type PackageItem = {
  id: number
  name: string
  hours: number
  price: number
  isPopular: boolean
  isActive: boolean
}

type AddonItem = {
  id: number
  name: string
  price: number
  unit: string | null
  isActive: boolean
}

export default function Settings() {
  const { toast, route } = useApp()
  const tab = route.tab ?? 'paket'
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('campose-token') || localStorage.getItem('admin_token') || '') : ''

  // Admin users state
  const [admins, setAdmins] = useState<{ id: number; name: string; email: string; role: string }[]>([])
  const [addAdm, setAddAdm] = useState(false)
  const [na, setNa] = useState({ n: '', e: '', p: '', r: 'ADMIN' })

  // Packages state
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [savingPackages, setSavingPackages] = useState(false)

  // Addons state
  const [addons, setAddons] = useState<AddonItem[]>([])
  const [savingAddons, setSavingAddons] = useState(false)
  const [newAddonModal, setNewAddonModal] = useState(false)
  const [newAddon, setNewAddon] = useState({ name: '', price: 0, unit: '' })

  // Terms state
  const [terms, setTerms] = useState<string[]>([])
  const [savingTerms, setSavingTerms] = useState(false)

  const [loading, setLoading] = useState(false)

  // Load packages
  useEffect(() => {
    if (tab === 'paket' && token) {
      fetch(`${API}/packages`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data.data && Array.isArray(data.data)) setPackages(data.data)
        })
        .catch(() => {})
    }
  }, [tab, token])

  // Load addons
  useEffect(() => {
    if (tab === 'add-on' && token) {
      fetch(`${API}/addons`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data.data && Array.isArray(data.data)) setAddons(data.data)
        })
        .catch(() => {})
    }
  }, [tab, token])

  // Load terms
  useEffect(() => {
    if (tab === 'syarat' && token) {
      fetch(`${API}/terms`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data.data && Array.isArray(data.data)) setTerms(data.data)
        })
        .catch(() => {})
    }
  }, [tab, token])

  // Load admins
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

  // Save Packages to Backend
  const handleSavePackages = async () => {
    setSavingPackages(true)
    try {
      for (const p of packages) {
        await fetch(`${API}/packages/${p.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: p.price, name: p.name, isPopular: p.isPopular }),
        })
      }
      toast('Harga paket berhasil disimpan ke database!', 'ok')
    } catch {
      toast('Gagal menyimpan harga paket', 'err')
    } finally {
      setSavingPackages(false)
    }
  }

  // Save Addons to Backend
  const handleSaveAddons = async () => {
    setSavingAddons(true)
    try {
      for (const a of addons) {
        await fetch(`${API}/addons/${a.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: a.price, name: a.name, unit: a.unit, isActive: a.isActive }),
        })
      }
      toast('Daftar add-on berhasil diperbarui ke database!', 'ok')
    } catch {
      toast('Gagal menyimpan add-on', 'err')
    } finally {
      setSavingAddons(false)
    }
  }

  // Create Addon
  const handleCreateAddon = async () => {
    if (!newAddon.name.trim()) return
    try {
      const res = await fetch(`${API}/addons`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAddon.name.trim(),
          price: Number(newAddon.price) || 0,
          unit: newAddon.unit.trim() || null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.data) {
        setAddons((prev) => [...prev, data.data])
        setNewAddonModal(false)
        setNewAddon({ name: '', price: 0, unit: '' })
        toast('Add-on baru berhasil ditambahkan!', 'ok')
      } else {
        toast(data.error?.message || 'Gagal menambahkan add-on', 'err')
      }
    } catch {
      toast('Terjadi kesalahan', 'err')
    }
  }

  // Delete Addon
  const handleDeleteAddon = async (id: number) => {
    if (!confirm('Hapus add-on ini?')) return
    try {
      const res = await fetch(`${API}/addons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setAddons((prev) => prev.filter((a) => a.id !== id))
        toast('Add-on berhasil dihapus', 'ok')
      }
    } catch {
      toast('Gagal menghapus add-on', 'err')
    }
  }

  // Save Terms to Backend
  const handleSaveTerms = async () => {
    setSavingTerms(true)
    try {
      const validTerms = terms.map((t) => t.trim()).filter(Boolean)
      const res = await fetch(`${API}/terms`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: validTerms }),
      })
      if (res.ok) {
        toast('Syarat & Ketentuan berhasil disimpan ke database!', 'ok')
      } else {
        toast('Gagal menyimpan syarat & ketentuan', 'err')
      }
    } catch {
      toast('Terjadi kesalahan koneksi', 'err')
    } finally {
      setSavingTerms(false)
    }
  }

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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base">Harga Paket Photobooth (Database)</h2>
                <p className="text-xs text-slate-500">Perubahan harga langsung diterapkan ke halaman publik pemesan</p>
              </div>
            </div>
            {packages.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">Memuat paket dari database...</div>
            ) : (
              packages.map((pkg) => (
                <div key={pkg.id} className="grid grid-cols-[1.5fr_2fr] items-center gap-3 p-3 rounded-xl bg-canvas">
                  <div>
                    <span className="font-bold text-sm block">{pkg.name} ({pkg.hours} Jam)</span>
                    <span className="text-xs text-slate-400">ID: {pkg.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">Rp</span>
                    <Input
                      type="number"
                      value={pkg.price}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0
                        setPackages((prev) => prev.map((item) => (item.id === pkg.id ? { ...item, price: val } : item)))
                      }}
                      aria-label={`Harga ${pkg.name}`}
                    />
                  </div>
                </div>
              ))
            )}
            <Btn v="primary" full loading={savingPackages} onClick={handleSavePackages} className="mt-4">
              Simpan Perubahan Harga Paket
            </Btn>
          </div>
        )}

        {tab === 'add-on' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base">Daftar Add-on Photobooth (Database)</h2>
                <p className="text-xs text-slate-500">Atur nama, harga, dan ketersediaan add-on yang muncul saat booking</p>
              </div>
              <Btn icon="plus" onClick={() => setNewAddonModal(true)}>
                Tambah Add-on
              </Btn>
            </div>

            {addons.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">Memuat add-on dari database...</div>
            ) : (
              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {addons.map((addon) => (
                  <div key={addon.id} className="flex items-center gap-3 p-3 rounded-xl bg-canvas">
                    <input
                      type="checkbox"
                      checked={addon.isActive}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setAddons((prev) => prev.map((item) => (item.id === addon.id ? { ...item, isActive: checked } : item)))
                      }}
                      className="w-4 h-4 rounded text-brand cursor-pointer"
                      title="Aktif / Nonaktif"
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={addon.name}
                        onChange={(e) => {
                          const val = e.target.value
                          setAddons((prev) => prev.map((item) => (item.id === addon.id ? { ...item, name: val } : item)))
                        }}
                        className="w-full text-sm font-semibold bg-transparent border-b border-transparent focus:border-brand focus:outline-none"
                      />
                      {addon.unit && <span className="text-xs text-slate-400">({addon.unit})</span>}
                    </div>
                    <div className="flex items-center gap-1.5 w-36">
                      <span className="text-xs text-slate-400">Rp</span>
                      <Input
                        type="number"
                        value={addon.price}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0
                          setAddons((prev) => prev.map((item) => (item.id === addon.id ? { ...item, price: val } : item)))
                        }}
                        className="!h-9 text-sm"
                        aria-label={`Harga ${addon.name}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddon(addon.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Hapus Add-on"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Btn v="primary" full loading={savingAddons} onClick={handleSaveAddons} className="mt-2">
              Simpan Perubahan Add-on
            </Btn>
          </div>
        )}

        {tab === 'syarat' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base">Syarat dan Ketentuan Layanan (Database)</h2>
                <p className="text-xs text-slate-500">Daftar aturan dan ketentuan yang wajib disetujui pemesan di formulir booking</p>
              </div>
              <Btn
                icon="plus"
                onClick={() => setTerms((prev) => [...prev, 'Ketentuan baru...'])}
              >
                Tambah Poin
              </Btn>
            </div>

            {terms.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">Memuat syarat & ketentuan...</div>
            ) : (
              <div className="space-y-3">
                {terms.map((term, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-canvas">
                    <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold grid place-items-center shrink-0 mt-1">
                      {idx + 1}
                    </span>
                    <textarea
                      rows={2}
                      value={term}
                      onChange={(e) => {
                        const val = e.target.value
                        setTerms((prev) => prev.map((item, i) => (i === idx ? val : item)))
                      }}
                      className="flex-1 text-sm bg-white p-2.5 rounded-lg border border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none resize-none leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={() => setTerms((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-2 text-slate-400 hover:text-red-600 transition shrink-0"
                      title="Hapus poin ini"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Btn v="primary" full loading={savingTerms} onClick={handleSaveTerms} className="mt-2">
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

      {/* Modal Addon Baru */}
      <Modal
        open={newAddonModal}
        onClose={() => setNewAddonModal(false)}
        title="Tambah Add-on Baru"
        footer={
          <>
            <Btn full onClick={() => setNewAddonModal(false)}>Batal</Btn>
            <Btn v="primary" full disabled={!newAddon.name.trim()} onClick={handleCreateAddon}>
              Simpan Add-on
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nama Add-on">
            <Input
              value={newAddon.name}
              onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
              placeholder="Contoh: Lampu Sorot Tambahan"
            />
          </Field>
          <Field label="Harga (Rupiah)">
            <Input
              type="number"
              value={newAddon.price || ''}
              onChange={(e) => setNewAddon({ ...newAddon, price: Number(e.target.value) || 0 })}
              placeholder="25000"
            />
          </Field>
          <Field label="Satuan / Keterangan (Opsional)">
            <Input
              value={newAddon.unit}
              onChange={(e) => setNewAddon({ ...newAddon, unit: e.target.value })}
              placeholder="Contoh: per orang / per sesi"
            />
          </Field>
        </div>
      </Modal>

      {/* Modal Admin Baru */}
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

