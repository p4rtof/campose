import { useState } from 'react'
import { Badge, Booking, PKG, STATUS, Status, ADDONS, VOUCHERS, fd, price, rp, useApp, BASE_URL } from './store'
import { A, useNav } from './router'
import { BackLink, Btn, Card, Crumbs, Empty, Field, Icon, Input, Modal, PageHead, Select, Skel, Textarea, cx } from './ui'

const PS = 8

export function BookingNew() {
  const { add, bookings } = useApp()
  const { navigate } = useNav()
  const [f, setF] = useState({ name: '', wa: '', pkg: '4', date: new Date().toISOString().slice(0, 10), start: '10:00', loc: '', event: 'Pernikahan' })
  const [loading, setLoading] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const pkg = Number(f.pkg) as 2 | 4 | 8
    const h = Number(f.start.slice(0, 2)) + pkg
    const n = bookings.length + 1

    await add({
      name: f.name,
      wa: f.wa,
      pkg,
      date: f.date,
      start: f.start,
      end: String(h).padStart(2, '0') + ':00',
      loc: f.loc,
      event: f.event || 'Booking Manual (WhatsApp)',
    })
    setLoading(false)
    navigate('/admin/booking')
  }

  return (
    <div>
      <Crumbs items={[['Booking', '/admin/booking'], ['Tambah Booking Manual']]} />
      <BackLink to="/admin/booking">Kembali ke daftar booking</BackLink>
      <PageHead title="Tambah Booking Manual" sub="Untuk booking yang masuk lewat WhatsApp atau offline" />
      <Card className="max-w-2xl p-5 md:p-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama pemesan">
            <Input required value={f.name} onChange={set('name')} placeholder="Contoh: Raka Aditya" />
          </Field>
          <Field label="Kontak WhatsApp">
            <Input required value={f.wa} onChange={set('wa')} placeholder="08..." inputMode="tel" />
          </Field>
          <Field label="Paket Photobooth">
            <Select value={f.pkg} onChange={set('pkg')}>
              {([2, 4, 8] as const).map((n) => (
                <option key={n} value={n}>
                  {n} Jam — {rp(PKG[n])}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal">
              <Input type="date" required value={f.date} onChange={set('date')} />
            </Field>
            <Field label="Jam mulai">
              <Input type="time" required value={f.start} onChange={set('start')} />
            </Field>
          </div>
          <Field label="Nama Acara">
            <Input value={f.event} onChange={set('event')} placeholder="Contoh: Resepsi Raka & Salsa" />
          </Field>
          <Field label="Lokasi acara">
            <Input required value={f.loc} onChange={set('loc')} placeholder="Nama venue, kota" />
          </Field>
          <div className="flex flex-col-reverse gap-2 pt-2 md:flex-row md:justify-end">
            <Btn to="/admin/booking" full className="md:w-auto">
              Batal
            </Btn>
            <Btn type="submit" v="primary" full loading={loading} className="md:w-auto">
              Simpan ke Database
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function Bookings() {
  const { bookings, q, setQ } = useApp()
  const [st, setSt] = useState('')
  const [pk, setPk] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [sheet, setSheet] = useState(false)

  const rows = bookings.filter(
    (b) =>
      (!st || b.status === st) &&
      (!pk || String(b.pkg) === pk) &&
      (!from || b.date >= from) &&
      (!to || b.date <= to) &&
      (!q || (b.name + b.inv + b.loc).toLowerCase().includes(q.toLowerCase())),
  )

  const pages = Math.max(1, Math.ceil(rows.length / PS))
  const cur = Math.min(page, pages)
  const slice = rows.slice((cur - 1) * PS, cur * PS)

  const reset = () => {
    setSt('')
    setPk('')
    setFrom('')
    setTo('')
    setQ('')
    setPage(1)
  }

  const filters = (
    <>
      <Select value={st} onChange={(e) => { setSt(e.target.value); setPage(1) }} aria-label="Status">
        <option value="">Semua status</option>
        {(Object.keys(STATUS) as Status[]).map((s) => (
          <option key={s} value={s}>{STATUS[s].label}</option>
        ))}
      </Select>
      <Select value={pk} onChange={(e) => { setPk(e.target.value); setPage(1) }} aria-label="Paket">
        <option value="">Semua paket</option>
        {[2, 4, 8].map((n) => <option key={n} value={n}>Paket {n} Jam</option>)}
      </Select>
      <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} aria-label="Dari tanggal" />
      <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} aria-label="Sampai tanggal" />
    </>
  )

  return (
    <div>
      <PageHead
        title="Daftar Booking"
        sub={`${rows.length} booking tersinkron realtime`}
        actions={
          <Btn v="primary" icon="plus" to="/admin/booking/tambah">
            Tambah Booking Manual
          </Btn>
        }
      />
      <Card className="mb-4 p-3 md:p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon n="search" s={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1) }}
              placeholder="Cari nama, nomor invoice, venue..."
              className="pl-10"
            />
          </div>
          <div className="lg:hidden">
            <Btn icon="filter" onClick={() => setSheet(true)} className="h-12">Filter</Btn>
          </div>
        </div>
        <div className="mt-3 hidden grid-cols-5 gap-3 lg:grid">
          {filters}
          <Btn v="ghost" onClick={reset}>Atur ulang</Btn>
        </div>
      </Card>

      <Modal open={sheet} onClose={() => setSheet(false)} title="Filter Booking" footer={<><Btn onClick={() => { reset(); setSheet(false) }} full>Atur Ulang</Btn><Btn v="primary" full onClick={() => setSheet(false)}>Terapkan</Btn></>}>
        <div className="space-y-3">{filters}</div>
      </Modal>

      {rows.length === 0 ? (
        <Card>
          <Empty
            title="Tidak ada booking ditemukan"
            text="Booking dari website akan otomatis masuk secara realtime ke sini."
            action={
              <Btn v="primary" icon="plus" to="/admin/booking/tambah">
                Tambah Booking Manual
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
                  {['No. Invoice', 'Pemesan', 'Paket', 'Tanggal & Jam', 'Lokasi', 'Total', 'Status Pembayaran', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice.map((b) => (
                  <tr key={b.id} className={cx('hover:bg-blue-50/40 transition', b.pay === 'Bukti Diunggah' && 'bg-amber-50/40')}>
                    <td className="px-4 py-3.5 font-medium text-accent">
                      <A to={'/admin/booking/' + b.inv} className="hover:underline">{b.inv}</A>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold">{b.name}</div>
                      <div className="text-xs text-slate-500">{b.wa}</div>
                    </td>
                    <td className="px-4 py-3.5">{b.pkg} Jam</td>
                    <td className="px-4 py-3.5">
                      {fd(b.date, { day: 'numeric', month: 'short' })}
                      <br />
                      <span className="text-xs text-slate-500">{b.start}–{b.end}</span>
                    </td>
                    <td className="max-w-40 truncate px-4 py-3.5 text-slate-600">{b.loc}</td>
                    <td className="px-4 py-3.5 font-semibold">{rp(price(b).total)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cx(
                          'rounded-full px-2.5 py-1 text-xs font-semibold',
                          b.pay === 'Bukti Diunggah'
                            ? 'bg-purple-100 text-purple-800 ring-2 ring-purple-300 animate-pulse'
                            : b.pay === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800',
                        )}
                      >
                        {b.pay}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><Badge s={b.status} /></td>
                    <td className="px-4 py-3.5">
                      <A
                        to={'/admin/booking/' + b.inv}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-brand hover:bg-brand/10"
                      >
                        Detail<Icon n="chevR" s={16} />
                      </A>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="space-y-3 md:hidden">
            {slice.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-accent">{b.inv}</p>
                    <p className="font-semibold">{b.name}</p>
                  </div>
                  <Badge s={b.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Paket</dt>
                    <dd>{b.pkg} Jam</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Total</dt>
                    <dd className="font-semibold">{rp(price(b).total)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Status Pembayaran</dt>
                    <dd className="font-medium text-brand">{b.pay}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Tanggal & jam</dt>
                    <dd>{fd(b.date)} · {b.start}–{b.end}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Lokasi</dt>
                    <dd>{b.loc}</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <Btn full to={'/admin/booking/' + b.inv}>Detail & Verifikasi</Btn>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Halaman {cur} dari {pages}</span>
            <div className="flex gap-2">
              <Btn icon="chevL" disabled={cur === 1} onClick={() => setPage(cur - 1)}>Sebelumnya</Btn>
              <Btn disabled={cur === pages} onClick={() => setPage(cur + 1)}>
                Berikutnya<Icon n="chevR" s={16} />
              </Btn>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const Row = ({ l, v }: { l: string; v: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-2 text-sm">
    <dt className="text-slate-500">{l}</dt>
    <dd className="text-right font-medium">{v}</dd>
  </div>
)

export function Detail() {
  const { route, get, bookings, confirmPayment, rejectPayment, rescheduleBooking, cancelBooking, completeBooking } = useApp()
  const b: Booking = get(route.id)
  const [dlg, setDlg] = useState<null | 'konfirmasi' | 'jadwal' | 'batal' | 'selesai' | 'reject' | 'previewProof'>(null)
  const [reason, setReason] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [nd, setNd] = useState(b.date)
  const [nt, setNt] = useState(b.start)
  const [loading, setLoading] = useState(false)
  const pr = price(b)

  const clash = bookings.some(
    (o) =>
      o.id !== b.id &&
      o.status !== 'dibatalkan' &&
      o.date === b.date &&
      o.start < b.end &&
      b.start < o.end &&
      b.status !== 'dibatalkan',
  )
  const closed = b.status === 'dibatalkan' || b.status === 'selesai'
  const close = () => { setDlg(null); setReason(''); setAdminNote('') }
  const wa = 'https://wa.me/' + b.wa.replace(/\D/g, '')

  const handleAccPayment = async () => {
    setLoading(true)
    await confirmPayment(b.inv, adminNote || 'Disetujui oleh admin')
    setLoading(false)
    close()
  }

  const handleRejectPayment = async () => {
    if (!reason.trim()) return
    setLoading(true)
    await rejectPayment(b.inv, reason)
    setLoading(false)
    close()
  }

  return (
    <div className="pb-4">
      <Crumbs items={[['Booking', '/admin/booking'], [b.inv]]} />
      <BackLink to="/admin/booking">Kembali ke daftar booking</BackLink>
      <PageHead title={b.inv} sub={`Dibuat ${b.history[0]?.t || '-'}`} actions={<Badge s={b.status} />} />

      {clash && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <Icon n="alert" className="mt-0.5 shrink-0" />
          Bentrok jadwal: ada booking lain di slot yang sama pada {fd(b.date)}. Cek di Kalender.
        </div>
      )}

      {/* Peringatan bukti bayar menunggu approval admin */}
      {b.pay === 'Bukti Diunggah' && (
        <div className="mb-5 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border-2 border-purple-300 bg-purple-50 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-xl bg-purple-600 text-white shrink-0">
              <Icon n="card" s={24} />
            </span>
            <div>
              <h3 className="font-bold text-purple-950 text-base">Customer Telah Mengunggah Bukti Pembayaran</h3>
              <p className="text-xs text-purple-800 mt-0.5">
                Periksa bukti bayar di bawah, lalu klik <b>ACC / Konfirmasi Lunas</b> atau <b>Tolak Bukti</b>.
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {b.paymentProofUrl && (
              <Btn v="outline" onClick={() => setDlg('previewProof')}>
                Lihat Foto Bukti
              </Btn>
            )}
            <Btn v="primary" icon="check" onClick={() => setDlg('konfirmasi')}>
              ACC & Lunas
            </Btn>
            <Btn v="dangerOutline" icon="x" onClick={() => setDlg('reject')}>
              Tolak
            </Btn>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Card Bukti Pembayaran (jika ada) */}
          {b.paymentProofUrl && (
            <Card className="p-5 border-2 border-brand/20">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-brand flex items-center gap-2">
                  <Icon n="card" /> Bukti Pembayaran dari Customer
                </h2>
                <span className="text-xs text-slate-500">Klik gambar untuk perbesar</span>
              </div>
              <div
                onClick={() => setDlg('previewProof')}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 max-h-72 flex items-center justify-center"
              >
                <img
                  src={`${BASE_URL}${b.paymentProofUrl}`}
                  alt="Bukti Transfer"
                  className="max-h-72 w-full object-contain transition group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-medium text-sm">
                  🔍 Klik untuk melihat ukuran penuh
                </div>
              </div>
              {b.adminNote && (
                <p className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border text-slate-600">
                  <b>Catatan Admin Sebelumnya:</b> {b.adminNote}
                </p>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-1 font-semibold">Data Pemesan</h2>
            <dl className="divide-y divide-slate-100">
              <Row l="Nama" v={b.name} />
              <Row l="Email" v={b.email} />
              <Row l="WhatsApp" v={b.wa} />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 font-semibold">Detail Event</h2>
            <dl className="divide-y divide-slate-100">
              <Row l="Nama acara" v={b.event} />
              <Row l="Tanggal & jam" v={`${fd(b.date)} · ${b.start}–${b.end}`} />
              <Row l="Lokasi" v={b.loc} />
              <Row l="Jumlah tamu" v={`${b.guests} orang`} />
              <Row l="Catatan" v={b.note || '-'} />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 font-semibold">Rincian Harga</h2>
            <dl className="divide-y divide-slate-100">
              <Row l={`Paket Photobooth ${b.pkg} Jam`} v={rp(pr.base)} />
              {b.addons.map((a) => (
                <Row key={a} l={`Add-on: ${a}`} v={rp(ADDONS[a] || 0)} />
              ))}
              <Row
                l="Voucher"
                v={
                  b.voucher ? (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 font-semibold">
                      {b.voucher}
                    </span>
                  ) : (
                    '-'
                  )
                }
              />
              <div className="flex justify-between py-3">
                <dt className="font-semibold text-base">Total Tagihan</dt>
                <dd className="text-xl font-extrabold text-brand">{rp(pr.total)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Tindakan Admin</h2>
            <div className="flex flex-col gap-2">
              {b.pay === 'Bukti Diunggah' ? (
                <>
                  <Btn v="primary" icon="check" full onClick={() => setDlg('konfirmasi')}>
                    ACC & Konfirmasi Lunas
                  </Btn>
                  <Btn v="dangerOutline" icon="x" full onClick={() => setDlg('reject')}>
                    Tolak Bukti Pembayaran
                  </Btn>
                </>
              ) : b.status === 'menunggu' ? (
                <Btn v="primary" icon="check" full onClick={() => setDlg('konfirmasi')}>
                  Tandai Lunas Manual
                </Btn>
              ) : null}

              {(b.status === 'terkonfirmasi' || b.status === 'reschedule') && (
                <Btn v="primary" icon="check" full onClick={() => setDlg('selesai')}>
                  Tandai Selesai
                </Btn>
              )}

              {!closed && (
                <Btn icon="repeat" full onClick={() => setDlg('jadwal')}>
                  Ubah Jadwal
                </Btn>
              )}
              <Btn icon="wa" full href={wa}>
                Hubungi via WhatsApp
              </Btn>
              <Btn icon="file" full to={'/admin/pembayaran/' + b.inv}>
                Lihat Invoice Customer
              </Btn>
              {!closed && (
                <Btn v="dangerOutline" icon="x" full onClick={() => setDlg('batal')}>
                  Batalkan Booking
                </Btn>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Riwayat Status</h2>
            <ol className="space-y-4 border-l-2 border-slate-100 pl-4">
              {[...b.history].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <i
                    className={cx(
                      'absolute top-1 -left-[23px] size-3 rounded-full border-2 border-white',
                      i === 0 ? 'bg-brand' : 'bg-slate-300',
                    )}
                  />
                  <p className="text-sm font-medium">{h.label}</p>
                  {h.note && <p className="text-xs text-slate-600">“{h.note}”</p>}
                  <p className="text-xs text-slate-500">{h.t}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      {/* Modal ACC Konfirmasi */}
      <Modal
        open={dlg === 'konfirmasi'}
        onClose={close}
        title="Konfirmasi Pembayaran Lunas?"
        footer={
          <>
            <Btn full onClick={close}>Kembali</Btn>
            <Btn v="primary" full loading={loading} onClick={handleAccPayment}>
              Ya, ACC Pembayaran
            </Btn>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-3">
          Status booking <b>{b.inv}</b> akan diubah menjadi <b>TERKONFIRMASI / LUNAS</b>. Customer akan melihat update secara realtime.
        </p>
        <Field label="Catatan Admin (Opsional)">
          <Input
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Contoh: Bukti transfer via BCA telah diverifikasi"
          />
        </Field>
      </Modal>

      {/* Modal Tolak Bukti */}
      <Modal
        open={dlg === 'reject'}
        onClose={close}
        title="Tolak Bukti Pembayaran?"
        footer={
          <>
            <Btn full onClick={close}>Kembali</Btn>
            <Btn v="danger" full disabled={!reason.trim()} loading={loading} onClick={handleRejectPayment}>
              Ya, Tolak Bukti
            </Btn>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-3">
          Customer akan diberitahu bahwa bukti ditolak dan diminta mengunggah ulang bukti yang valid.
        </p>
        <Field label="Alasan Penolakan (Wajib)">
          <Textarea
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Nominal transfer kurang, atau foto resi buram"
          />
        </Field>
      </Modal>

      {/* Modal Preview Bukti Foto Fullsize */}
      {b.paymentProofUrl && (
        <Modal open={dlg === 'previewProof'} onClose={close} title={`Bukti Bayar #${b.inv}`} wide>
          <div className="flex flex-col items-center">
            <img
              src={`${BASE_URL}${b.paymentProofUrl}`}
              alt="Bukti Transfer Penuh"
              className="max-h-[75vh] w-auto rounded-xl object-contain shadow-md"
            />
            <div className="mt-4 flex gap-3 w-full justify-end">
              <Btn v="primary" icon="check" onClick={() => { close(); setDlg('konfirmasi') }}>
                ACC Pembayaran Ini
              </Btn>
              <Btn v="dangerOutline" icon="x" onClick={() => { close(); setDlg('reject') }}>
                Tolak
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Selesai */}
      <Modal
        open={dlg === 'selesai'}
        onClose={close}
        title="Tandai event selesai?"
        footer={
          <>
            <Btn full onClick={close}>Kembali</Btn>
             <Btn
               v="primary"
               full
               onClick={async () => {
                 await completeBooking(b.inv)
                 close()
               }}
             >
               Ya, Tandai Selesai
             </Btn>
          </>
        }
      >
        <p className="text-sm text-slate-600">Status akan berubah menjadi Selesai.</p>
      </Modal>

      {/* Modal Ubah Jadwal */}
      <Modal
        open={dlg === 'jadwal'}
        onClose={close}
        title="Ubah Jadwal Acara"
        footer={
          <>
            <Btn full onClick={close}>Batal</Btn>
            <Btn
              v="primary"
              full
              onClick={async () => {
                const h = Number(nt.slice(0, 2)) + b.pkg
                await rescheduleBooking(b.inv, nd, nt, String(h).padStart(2, '0') + ':00')
                close()
              }}
            >
              Simpan Jadwal Baru
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal baru">
            <Input type="date" value={nd} onChange={(e) => setNd(e.target.value)} />
          </Field>
          <Field label="Jam mulai">
            <Input type="time" value={nt} onChange={(e) => setNt(e.target.value)} />
          </Field>
        </div>
      </Modal>

      {/* Modal Batalkan */}
      <Modal
        open={dlg === 'batal'}
        onClose={close}
        title="Batalkan booking?"
        footer={
          <>
            <Btn full onClick={close}>Kembali</Btn>
            <Btn
              v="danger"
              full
              disabled={!reason.trim()}
              onClick={async () => {
                await cancelBooking(b.inv, reason)
                close()
              }}
            >
              Ya, Batalkan
            </Btn>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600">Tindakan ini akan membatalkan booking. Tulis alasan pembatalan.</p>
        <Field label="Alasan pembatalan">
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Customer meminta reschedule melebihi kuota"
          />
        </Field>
      </Modal>
    </div>
  )
}
