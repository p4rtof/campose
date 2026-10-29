import { useState } from 'react'
import { A, useNav } from './router'
import { V, rp, useApp, API } from './store'
import { BackLink, Btn, Card, Crumbs, Empty, Field, Icon, Input, Modal, PageHead, Select, Toggle, cx } from './ui'

const state = (v: V) => {
  const today = new Date().toISOString().slice(0, 10)
  if (v.to < today) return 'kedaluwarsa'
  return v.on ? 'aktif' : 'nonaktif'
}
const SC = { aktif: 'bg-emerald-100 text-emerald-800', nonaktif: 'bg-slate-200 text-slate-700', kedaluwarsa: 'bg-red-100 text-red-700' }
const blank: V = { code: '', type: 'nominal', val: 100000, min: 0, from: new Date().toISOString().slice(0, 10), to: '2026-12-31', quota: 50, used: 0, on: true }
const val = (v: V) => (v.type === 'persen' ? v.val + '%' : rp(v.val))

export default function Voucher() {
  const { toast, vouchers, setVouchers } = useApp()
  const [del, setDel] = useState<string | null>(null)
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('campose-token') || localStorage.getItem('admin_token') || '') : ''

  const handleDelete = async (code: string) => {
    try {
      await fetch(`${API}/vouchers/${code}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setVouchers((prev) => prev.filter((v) => v.code !== code))
      toast(`Voucher ${code} berhasil dihapus`, 'ok')
    } catch {
      toast('Gagal menghapus voucher', 'err')
    }
    setDel(null)
  }

  return (
    <div>
      <PageHead
        title="Voucher Promo"
        sub="Kelola kode promo yang dapat digunakan customer saat booking"
        actions={
          <Btn v="primary" icon="plus" to="/admin/voucher/baru">
            Buat Voucher Baru
          </Btn>
        }
      />

      {vouchers.length === 0 ? (
        <Card>
          <Empty
            title="Belum ada voucher"
            text="Buat voucher pertama untuk memberikan potongan harga kepada customer."
            action={
              <Btn v="primary" icon="plus" to="/admin/voucher/baru">
                Buat Voucher Baru
              </Btn>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  {['Kode', 'Jenis', 'Nilai Potongan', 'Periode Berlaku', 'Kuota', 'Terpakai', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((v) => (
                  <tr key={v.code} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3.5 font-bold text-accent">
                      <A to={'/admin/voucher/' + v.code} className="hover:underline">{v.code}</A>
                    </td>
                    <td className="px-4 py-3.5 capitalize">{v.type}</td>
                    <td className="px-4 py-3.5 font-semibold text-brand">{val(v)}</td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {v.from} s/d {v.to}
                    </td>
                    <td className="px-4 py-3.5">{v.quota}</td>
                    <td className="px-4 py-3.5">
                      <div className="h-1.5 w-20 rounded bg-slate-200">
                        <div
                          className="h-full rounded bg-brand"
                          style={{ width: `${Math.min(100, (v.used / (v.quota || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{v.used} terpakai</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cx('rounded-full px-2.5 py-1 text-xs font-medium capitalize', SC[state(v) as keyof typeof SC])}>
                        {state(v)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        <A
                          to={'/admin/voucher/' + v.code}
                          aria-label="Ubah"
                          className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                        >
                          <Icon n="edit" s={18} />
                        </A>
                        <button
                          aria-label="Hapus"
                          onClick={() => setDel(v.code)}
                          className="grid size-10 place-items-center rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <Icon n="trash" s={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="space-y-3 md:hidden">
            {vouchers.map((v) => (
              <Card key={v.code} className="p-4">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-accent text-base">{v.code}</p>
                  <span className={cx('rounded-full px-2.5 py-1 text-xs font-medium capitalize', SC[state(v) as keyof typeof SC])}>
                    {state(v)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold">
                  Diskon {val(v)} · {v.from} s/d {v.to}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Kuota: {v.used} dari {v.quota} terpakai
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Btn to={'/admin/voucher/' + v.code}>Ubah</Btn>
                  <Btn v="dangerOutline" onClick={() => setDel(v.code)}>Hapus</Btn>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={del !== null}
        onClose={() => setDel(null)}
        title="Hapus voucher?"
        footer={
          <>
            <Btn full onClick={() => setDel(null)}>Batal</Btn>
            <Btn v="danger" full onClick={() => del && handleDelete(del)}>
              Ya, Hapus
            </Btn>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Voucher <b>{del}</b> akan dihapus secara permanen dari database.
        </p>
      </Modal>
    </div>
  )
}

export function VoucherForm() {
  const { route, vouchers, setVouchers, toast } = useApp()
  const { navigate } = useNav()
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('campose-token') || localStorage.getItem('admin_token') || '') : ''
  const editing = vouchers.find((v) => v.code === route.code)
  const [ed, setEd] = useState<V>(editing ?? blank)
  const [loading, setLoading] = useState(false)
  const upd = (p: Partial<V>) => setEd({ ...ed, ...p })

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await fetch(`${API}/vouchers/${editing.code}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discountAmount: ed.val,
            validFrom: ed.from,
            validUntil: ed.to,
            quota: ed.quota,
            isActive: ed.on,
          }),
        })
        setVouchers((prev) => prev.map((v) => (v.code === editing.code ? ed : v)))
      } else {
        await fetch(`${API}/vouchers`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: ed.code,
            discountAmount: ed.val,
            validFrom: ed.from,
            validUntil: ed.to,
            quota: ed.quota,
            isActive: ed.on,
          }),
        })
        setVouchers((prev) => [ed, ...prev])
      }
      toast('Voucher berhasil disimpan ke database', 'ok')
      navigate('/admin/voucher')
    } catch {
      toast('Gagal menyimpan voucher', 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Crumbs items={[['Voucher', '/admin/voucher'], [editing ? editing.code : 'Voucher Baru']]} />
      <BackLink to="/admin/voucher">Kembali ke daftar voucher</BackLink>
      <PageHead title={editing ? `Ubah Voucher #${editing.code}` : 'Buat Voucher Baru'} />
      <Card className="max-w-2xl p-5 md:p-6">
        <form onSubmit={save} className="space-y-4">
          <Field label="Kode voucher">
            <Input
              required
              value={ed.code}
              disabled={!!editing}
              onChange={(e) => upd({ code: e.target.value.toUpperCase().replace(/\s/g, '') })}
              placeholder="CONTOH: PROMO50"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenis Potongan">
              <Select value={ed.type} onChange={(e) => upd({ type: e.target.value as V['type'] })}>
                <option value="nominal">Nominal Rupiah (Rp)</option>
              </Select>
            </Field>
            <Field label="Besar Potongan (Rp)">
              <Input type="number" min={1000} value={ed.val} onChange={(e) => upd({ val: +e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Berlaku dari">
              <Input type="date" value={ed.from} onChange={(e) => upd({ from: e.target.value })} />
            </Field>
            <Field label="Sampai tanggal">
              <Input type="date" value={ed.to} onChange={(e) => upd({ to: e.target.value })} />
            </Field>
          </div>
          <Field label="Kuota Maksimal Penggunaan">
            <Input type="number" value={ed.quota} onChange={(e) => upd({ quota: +e.target.value })} />
          </Field>
          <div className="flex items-center justify-between rounded-xl bg-canvas p-3">
            <span className="text-sm font-medium">Status Voucher Aktif</span>
            <Toggle on={ed.on} set={(v) => upd({ on: v })} label="Voucher aktif" />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 md:flex-row md:justify-end">
            <Btn to="/admin/voucher" full className="md:w-auto">Batal</Btn>
            <Btn type="submit" v="primary" full loading={loading} className="md:w-auto">
              Simpan Voucher
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  )
}
