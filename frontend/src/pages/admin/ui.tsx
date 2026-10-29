import { ReactNode, useEffect } from 'react'
import { A } from './router'

export const cx = (...a: (string | false | undefined | null)[]) => a.filter(Boolean).join(' ')

const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  calendar: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  card: 'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM2 10h20',
  ticket: 'M2 9V6h20v3a3 3 0 0 0 0 6v3H2v-3a3 3 0 0 0 0-6zM14 6v12',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.4-2.7a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  menu: 'M3 6h18M3 12h18M3 18h18',
  x: 'M18 6L6 18M6 6l12 12',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeoff: 'M17.9 17.9A10 10 0 0 1 12 19C6 19 2 12 2 12a18 18 0 0 1 4.1-5M9.9 5.1A9 9 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-2.2 3M3 3l18 18',
  check: 'M20 6L9 17l-5-5',
  chevL: 'M15 18l-6-6 6-6',
  chevR: 'M9 18l6-6-6-6',
  chevD: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  filter: 'M3 4h18l-7 8v6l-4 2v-8z',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  wa: 'M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  more: 'M12 12h.01M19 12h.01M5 12h.01',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  lock: 'M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  cursor: 'M5 3l14 7-6 2-2 6z',
  trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  loc: 'M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8zM12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
}
export function Icon({ n, s = 20, className }: { n: string; s?: number; className?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={n === 'more' ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={P[n] || P.info} />
    </svg>
  )
}

export function Logo({ dark, size = 28, admin = true }: { dark?: boolean; size?: number; admin?: boolean }) {
  const fg = dark ? '#1A76D2' : '#fff'
  const bg = dark ? '#fff' : '#1A76D2'
  return (
    <span className="inline-flex items-center gap-2 select-none" aria-label="Campose Admin">
      <span className="inline-flex items-center font-extrabold lowercase" style={{ color: fg, fontSize: size, letterSpacing: '-0.04em', lineHeight: 1 }}>
        camp
        <svg width={size * 0.95} height={size * 0.95} viewBox="0 0 24 24" className="mx-[1px]">
          <circle cx="12" cy="12" r="11" fill={fg} />
          {[0, 60, 120, 180, 240, 300].map((r) => (
            <path key={r} d="M12 12 L12 3.5 L18 7 Z" fill={bg} transform={`rotate(${r} 12 12)`} opacity=".92" />
          ))}
          <circle cx="12" cy="12" r="2.2" fill={fg} />
        </svg>
        se
      </span>
      {admin && <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide', dark ? 'bg-brand/10 text-brand' : 'bg-white/20 text-white')}>Admin</span>}
    </span>
  )
}

type BtnP = { children: ReactNode; v?: 'primary' | 'outline' | 'danger' | 'ghost' | 'dangerOutline'; icon?: string; onClick?: () => void; full?: boolean; type?: 'button' | 'submit'; disabled?: boolean; loading?: boolean; href?: string; to?: string; className?: string }
export function Btn({ children, v = 'outline', icon, onClick, full, type = 'button', disabled, loading, href, to, className }: BtnP) {
  const base = cx(
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[.98] disabled:opacity-60 min-h-12 md:min-h-10 cursor-pointer',
    full && 'w-full',
    v === 'primary' && 'bg-brand text-white hover:bg-accent shadow-[0_6px_16px_rgba(26,118,210,.3)]',
    v === 'outline' && 'border border-slate-300 bg-white text-ink hover:border-brand hover:text-brand',
    v === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
    v === 'dangerOutline' && 'border border-red-300 bg-white text-red-600 hover:bg-red-50',
    v === 'ghost' && 'text-slate-600 hover:bg-slate-100',
    className,
  )
  const inner = <>{loading ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : icon && <Icon n={icon} s={18} />}{children}</>
  if (to) return <A to={to} className={base}>{inner}</A>
  if (href) return <a href={href} target="_blank" rel="noreferrer" className={base}>{inner}</a>
  return <button type={type} onClick={onClick} disabled={disabled || loading} className={base}>{inner}</button>
}

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx('rounded-2xl bg-white shadow-card', className)}>{children}</div>
)

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] md:items-center md:p-6" onClick={onClose}>
      <div role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()} className={cx('pop flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl md:rounded-2xl', wide ? 'md:max-w-2xl' : 'md:max-w-md')}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Tutup" className="grid size-10 place-items-center rounded-full hover:bg-slate-100"><Icon n="x" /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-4 md:flex-row md:justify-end">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}
export const inputCls = 'h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15 md:h-11'
export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, p.className)} />
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(inputCls, 'pr-8', p.className)} />
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(inputCls, 'h-auto py-3', p.className)} />

export function Toggle({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => set(!on)} className={cx('relative h-7 w-12 shrink-0 rounded-full transition', on ? 'bg-brand' : 'bg-slate-300')}>
      <span className={cx('absolute top-1 size-5 rounded-full bg-white shadow transition-all', on ? 'left-6' : 'left-1')} />
    </button>
  )
}

export const Skel = ({ className }: { className?: string }) => <div className={cx('skel', className)} />

export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
        <rect x="40" y="6" width="60" height="98" rx="8" fill="#fff" stroke="#1A76D2" strokeWidth="2" transform="rotate(-6 70 55)" />
        <g transform="rotate(-6 70 55)">
          {[14, 40, 66].map((y) => <rect key={y} x="48" y={y} width="44" height="22" rx="4" fill="#DCE9F8" />)}
          <circle cx="70" cy="25" r="6" fill="#1A76D2" opacity=".5" /><circle cx="70" cy="51" r="6" fill="#1A76D2" opacity=".5" /><circle cx="70" cy="77" r="6" fill="#1A76D2" opacity=".5" />
        </g>
        <circle cx="112" cy="24" r="6" fill="#C26AE8" opacity=".6" /><circle cx="26" cy="80" r="5" fill="#FF5FBF" opacity=".6" />
      </svg>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-[28px]">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      {actions && <div className="flex flex-col gap-2 md:flex-row">{actions}</div>}
    </div>
  )
}

export function Crumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
      {items.map(([l, to], i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          {to ? <A to={to} className="hover:text-brand">{l}</A> : <span className="font-medium text-ink">{l}</span>}
        </span>
      ))}
    </nav>
  )
}
export const BackLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <A to={to} className="mb-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-slate-600 hover:text-brand"><Icon n="chevL" s={16} />{children}</A>
)
