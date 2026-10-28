import { Icon } from '@/components/Icon'

export function FlowSteps({ step }: { step: number }) {
  const S = ['Pilih Paket', 'Detail Pesanan', 'Invoice', 'Pembayaran', 'Selesai']
  return (
    <>
      <div className="md:hidden text-center">
        <div className="flex justify-center gap-1.5">{S.map((s, i) => <span key={s} className={`h-1.5 rounded-full ${i === step ? 'w-8 bg-brand' : i < step ? 'w-4 bg-brand' : 'w-4 bg-[#d6e4f5]'}`} />)}</div>
        <p className="mt-2 text-sm text-ink/70">Langkah {step + 1} dari {S.length} · <b className="text-brand">{S[step]}</b></p>
      </div>
      <ol className="hidden md:flex items-center justify-center gap-3 text-sm">
        {S.map((s, i) => (
          <li key={s} className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full grid place-items-center font-semibold ${i <= step ? 'bg-brand text-white' : 'bg-[#e8f0fa] text-ink/50'}`}>{i < step ? <Icon n="check" s={16} /> : i + 1}</span>
            <span className={i === step ? 'font-semibold text-brand' : 'text-ink/60'}>{s}</span>
            {i < S.length - 1 && <span className={`w-10 h-0.5 ${i < step ? 'bg-brand' : 'bg-[#d6e4f5]'}`} />}
          </li>
        ))}
      </ol>
    </>
  )
}
