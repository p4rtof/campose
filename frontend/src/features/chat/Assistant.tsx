import { useEffect, useState } from 'react'
import { Aperture } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { WA } from '@/data/config'
import { DStatus, dateStatus } from '@/data/schedule'
import { Booking, useBooking } from '@/features/booking/booking-state'
import { MONTHS } from '@/lib/format'
import { col } from '@/lib/image'
import { navigate, usePath } from '@/lib/router'

export type Msg = { from: 'bot' | 'me'; text: string; act?: { label: string; kind: 'book' | 'wa' | 'photobox'; day?: number; month?: number } }
export const STATUS_TXT: Record<DStatus, string> = { tersedia: 'Tersedia', penuh: 'Penuh', dibooking: 'Sudah dibooking', lewat: 'Sudah lewat' }
export function Assistant() {
  const { set } = useBooking()
  const path = usePath()
  const lift = path === '/detail-pesanan'
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: 'Halo! Aku Asisten Campose. Mau cek tanggal Photobooth, lihat harga paket, atau cari lokasi Photobox?' }])
  const reply = (q: string): Msg => {
    const l = q.toLowerCase()
    const num = l.match(/\b(\d{1,2})\b/)
    if (num && +num[1] >= 1 && +num[1] <= 31) {
      const day = +num[1], month = l.includes('agu') ? 8 : 7
      const st = dateStatus(month, day)
      return st === 'tersedia'
        ? { from: 'bot', text: `Tanggal ${day} ${MONTHS[month]} 2026 berstatus ${STATUS_TXT[st]}. Yuk amankan sekarang!`, act: { label: 'Booking tanggal ini', kind: 'book', day, month } }
        : { from: 'bot', text: `Maaf, tanggal ${day} ${MONTHS[month]} 2026 berstatus ${STATUS_TXT[st]}. Coba tanggal lain, atau tanya CS untuk opsi cadangan.`, act: { label: 'Chat WhatsApp CS', kind: 'wa' } }
    }
    if (l.includes('tanggal')) return { from: 'bot', text: 'Tanggal berapa yang ingin dicek untuk sewa Photobooth? Contoh: "18 Juli" atau "25 Agustus".' }
    if (l.includes('harga') || l.includes('paket')) return { from: 'bot', text: 'Harga paket: 2 Jam Rp1.299.000, 4 Jam Rp2.199.000 (Paling Populer), 8 Jam Rp4.099.000. Semua unlimited print.', act: { label: 'Lihat paket', kind: 'book' } }
    if (l.includes('photobox') || l.includes('lokasi')) return { from: 'bot', text: 'Photobox adalah mesin self-service di lokasi mitra, saat ini di Lekha Cafe. Tanpa booking, tinggal datang.', act: { label: 'Lihat Lokasi & Promo', kind: 'photobox' } }
    if (l.includes('voucher') || l.includes('kode')) return { from: 'bot', text: 'Voucher Photobox didapat dari promo mitra, misalnya belanja Rp200 ribu di Lekha Cafe. Cek periode dan syaratnya di halaman Lokasi & Promo.', act: { label: 'Lihat Promo', kind: 'photobox' } }
    if (l.includes('cs') || l.includes('hubungi')) return { from: 'bot', text: 'Tim CS kami siap bantu lewat WhatsApp setiap hari 09.00 – 21.00 WIB.', act: { label: 'Chat WhatsApp CS', kind: 'wa' } }
    return { from: 'bot', text: 'Hmm, aku belum paham pertanyaan itu. Biar cepat, langsung ngobrol dengan CS kami ya.', act: { label: 'Chat WhatsApp CS', kind: 'wa' } }
  }
  const send = (q: string) => { if (!q.trim()) return; setMsgs((m) => [...m, { from: 'me', text: q }]); setText(''); setTimeout(() => setMsgs((m) => [...m, reply(q)]), 450) }
  const act = (a: NonNullable<Msg['act']>) => {
    if (a.kind === 'wa') return void window.open(WA, '_blank')
    if (a.kind === 'photobox') { setOpen(false); return navigate('/photobox') }
    if (a.day) set({ day: a.day, month: a.month!, time: null })
    setOpen(false); navigate(a.day ? '/detail-pesanan' : '/booking-photobooth')
  }
  useEffect(() => { document.getElementById('chat-end')?.scrollIntoView() }, [msgs, open])
  return (
    <div className={`fixed right-4 md:right-6 md:bottom-6 z-50 ${lift ? 'bottom-28' : 'bottom-5'}`}>
      {open && (
        <div className="pop fixed inset-x-3 top-20 bottom-24 md:absolute md:inset-auto md:bottom-20 md:right-0 md:w-[380px] md:h-[520px] bg-white rounded-3xl shadow-2xl border border-[#e3edf9] flex flex-col overflow-hidden">
          <div className="bg-brand text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-white grid place-items-center overflow-hidden"><Aperture size={36} /></span><div><div className="font-semibold leading-tight">Asisten Campose</div><div className="text-xs text-white/80">Online · membalas instan</div></div></div>
            <button onClick={() => setOpen(false)} aria-label="Tutup" className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/15"><Icon n="x" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f6faff]">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : ''}`}>
                <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed rounded-2xl ${m.from === 'me' ? 'bg-brand text-white rounded-br-md' : 'bg-white border border-[#e3edf9] rounded-bl-md'}`}>
                  {m.text}
                  {m.act && <button onClick={() => act(m.act!)} className="mt-3 w-full h-10 rounded-full bg-brand text-white font-semibold text-sm hover:bg-royal">{m.act.label}</button>}
                </div>
              </div>
            ))}
            <div id="chat-end" />
          </div>
          <div className="px-4 pt-3 flex flex-wrap gap-2 border-t border-[#e3edf9]">
            {['Cek tanggal Photobooth', 'Harga paket', 'Lokasi Photobox', 'Voucher', 'Hubungi CS'].map((q) => (
              <button key={q} onClick={() => send(q)} className="h-9 px-4 rounded-full border border-brand text-brand text-[13px] font-medium hover:bg-brand hover:text-white transition">{q}</button>
            ))}
          </div>
          <form className="p-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(text) }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis pesan… cth: tanggal 18 Juli" className="field !h-11 !rounded-full text-sm" />
            <button className="w-11 h-11 shrink-0 rounded-full bg-brand text-white grid place-items-center hover:bg-royal" aria-label="Kirim"><Icon n="send" s={18} /></button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen(!open)} aria-label="Asisten AI" className="group w-14 h-14 md:w-auto md:h-16 md:pl-5 md:pr-6 justify-center rounded-full bg-brand text-white shadow-[0_14px_30px_-8px_rgba(26,118,210,.8)] flex items-center gap-3 font-semibold hover:bg-royal transition">
        <Icon n="chat" s={26} /> <span className="hidden md:inline text-[15px]">Tanya Asisten</span>
      </button>
    </div>
  )
}
