import { useState } from 'react'
import { Logo, SilkWaves } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { col } from '@/lib/image'
import { api, apiErrorMessage } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────
type Jenis = 'Kemitraan' | 'Sponsorship' | 'Kolaborasi'

interface FormState {
  nama: string
  email: string
  no_wa: string
  jenis: Jenis
  pesan: string
}

interface FieldError {
  nama?: string
  email?: string
  no_wa?: string
  pesan?: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function validate(form: FormState): FieldError {
  const errs: FieldError = {}
  if (!form.nama.trim() || form.nama.trim().length < 2)
    errs.nama = 'Nama minimal 2 karakter'
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.email = 'Format email tidak valid'
  if (!form.no_wa.trim() || !/^08\d{8,13}$/.test(form.no_wa.replace(/\s/g, '')))
    errs.no_wa = 'Nomor WA harus diawali 08, contoh: 081234567890'
  if (!form.pesan.trim() || form.pesan.trim().length < 10)
    errs.pesan = 'Pesan minimal 10 karakter'
  return errs
}

// ── Sub-components ───────────────────────────────────────────────────────────
function FieldWrap({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-ink/80">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
          <Icon n="alert" s={13} /> {error}
        </p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function KemitraanPage() {
  const [form, setForm] = useState<FormState>({ nama: '', email: '', no_wa: '', jenis: 'Kemitraan', pesan: '' })
  const [errors, setErrors] = useState<FieldError>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    if (errors[key as keyof FieldError]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    // Client-side validation
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      await api.post('/api/v1/kemitraan', form)
      setSent(true)
    } catch (err) {
      setServerError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden text-white py-12 md:py-24" style={{ background: 'linear-gradient(135deg,#1A76D2,#1F4FBF)' }}>
        <SilkWaves dark />
        <div className="relative max-w-[1280px] mx-auto px-5 md:px-8 text-center">
          <div className="hidden md:flex justify-center mb-8">
            <Logo light size={40} />
          </div>
          <h1 className="text-[32px] md:text-6xl font-extrabold uppercase">Open for Collaborations.</h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-white/90 font-light leading-relaxed">
            Kami terbuka untuk kolaborasi, kemitraan, dan sponsorship. Yuk bikin setiap event lebih berkesan bersama{' '}
            <b className="font-bold">Campose</b>.
          </p>
        </div>
      </section>

      {/* ── Form Section ── */}
      <section className="py-20 silk-light">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-8 md:gap-12 items-start">
          {/* Decorative image */}
          <div className="rounded-2xl md:rounded-3xl overflow-hidden grayscale shadow-xl" style={col(265, 0, 315, 217)} />

          {/* Card */}
          <div className="card p-5 md:p-9">
            {sent ? (
              /* ── Success State ── */
              <div className="pop text-center py-10 space-y-4">
                <span className="w-20 h-20 rounded-full bg-[#e3f7ec] text-[#1fa463] grid place-items-center mx-auto">
                  <Icon n="check" s={40} />
                </span>
                <h2 className="text-2xl font-extrabold">Pengajuan Terkirim! 🎉</h2>
                <p className="text-ink/65 max-w-sm mx-auto leading-relaxed">
                  Terima kasih! Email konfirmasi pengajuan <b>{form.jenis}</b> kamu telah dikirim. Tim kami akan menghubungi{' '}
                  <b>{form.nama}</b> dalam <b>1–2 hari kerja</b>.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ nama: '', email: '', no_wa: '', jenis: 'Kemitraan', pesan: '' }) }}
                  className="btn btn-outline mt-4"
                >
                  Ajukan Lagi
                </button>
              </div>
            ) : (
              /* ── Form State ── */
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <h2 className="text-2xl font-extrabold uppercase">
                    Ajukan <span className="text-royal">Kerja Sama</span>
                  </h2>
                  <p className="mt-1 text-sm text-ink/60">Isi form di bawah dan tim Campose akan menghubungi kamu.</p>
                </div>

                {/* Jenis Pengajuan */}
                <div>
                  <p className="text-sm font-semibold text-ink/80 mb-2">Jenis Pengajuan</p>
                  <div className="flex flex-wrap gap-2">
                    {(['Kemitraan', 'Sponsorship', 'Kolaborasi'] as Jenis[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="chip"
                        data-on={form.jenis === t}
                        onClick={() => setForm(prev => ({ ...prev, jenis: t }))}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nama */}
                <FieldWrap label="Nama Lengkap" error={errors.nama}>
                  <input
                    required
                    className={`field ${errors.nama ? 'border-red-400 focus:ring-red-300' : ''}`}
                    placeholder="Masukkan nama instansi/pengirim"
                    value={form.nama}
                    onChange={set('nama')}
                  />
                </FieldWrap>

                {/* Email & WA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldWrap label="Email" error={errors.email}>
                    <input
                      required
                      type="email"
                      className={`field ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                      placeholder="Masukkan email"
                      value={form.email}
                      onChange={set('email')}
                    />
                  </FieldWrap>
                  <FieldWrap label="Nomor WhatsApp" error={errors.no_wa}>
                    <input
                      required
                      type="tel"
                      className={`field ${errors.no_wa ? 'border-red-400 focus:ring-red-300' : ''}`}
                      placeholder="08123456789"
                      value={form.no_wa}
                      onChange={set('no_wa')}
                    />
                  </FieldWrap>
                </div>

                {/* Pesan */}
                <FieldWrap label="Pesan / Ide Kerja Sama" error={errors.pesan}>
                  <textarea
                    required
                    rows={5}
                    className={`field resize-none ${errors.pesan ? 'border-red-400 focus:ring-red-300' : ''}`}
                    placeholder="Ceritakan ide kerja samamu, event yang direncanakan, atau pertanyaan seputar kemitraan…"
                    value={form.pesan}
                    onChange={set('pesan')}
                  />
                  <p className="text-xs text-ink/40 text-right">{form.pesan.length}/2000</p>
                </FieldWrap>

                {/* Server error */}
                {serverError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <Icon n="alert" s={16} />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full !h-14 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Mengirim…
                    </span>
                  ) : (
                    'Kirim Pengajuan'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
