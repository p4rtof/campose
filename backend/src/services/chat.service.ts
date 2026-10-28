import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/errors.js'

type Intent = 'TANYA_HARGA' | 'TANYA_JADWAL' | 'BOOKING' | 'KEMITRAAN' | 'KELUHAN' | 'LAINNYA'
type Action = { type: 'BOOK' | 'WHATSAPP' | 'PARTNERSHIP_FORM' | 'NONE'; label?: string }
type Result = { reply: string; intent: Intent; confidence: number; action: Action }

const AI_URL = process.env.AI_SERVICE_URL
const headers = { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.AI_INTERNAL_KEY ?? '' }

async function callAi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${AI_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) })
  if (res.status === 429) throw new AppError(503, 'AI_QUOTA_EXCEEDED', 'Asisten sedang sibuk. Coba lagi sebentar atau hubungi CS lewat WhatsApp.')
  if (!res.ok) throw new AppError(502, 'AI_SERVICE_ERROR', 'Asisten sedang bermasalah. Hubungi CS lewat WhatsApp.')
  return (await res.json()) as T
}

// Cadangan sederhana jika layanan AI belum tersedia (digantikan classifier tim DS).
function keywordIntent(t: string): Intent {
  const l = t.toLowerCase()
  if (/(harga|paket|biaya|tarif)/.test(l)) return 'TANYA_HARGA'
  if (/(tanggal|jadwal|kosong|tersedia)/.test(l)) return 'TANYA_JADWAL'
  if (/(booking|pesan|sewa)/.test(l)) return 'BOOKING'
  if (/(franchise|kemitraan|mitra)/.test(l)) return 'KEMITRAAN'
  if (/(komplain|kecewa|keluhan|refund)/.test(l)) return 'KELUHAN'
  return 'LAINNYA'
}

async function fallbackReply(intent: Intent): Promise<Omit<Result, 'intent' | 'confidence'>> {
  const wa: Action = { type: 'WHATSAPP', label: 'Chat WhatsApp CS' }
  switch (intent) {
    case 'TANYA_HARGA': {
      const pk = await prisma.package.findMany({ where: { isActive: true }, orderBy: { hours: 'asc' } })
      const list = pk.map((p) => `${p.name} Rp${p.price.toLocaleString('id-ID')}`).join(', ')
      return { reply: `Harga paket Photobooth: ${list}.`, action: { type: 'BOOK', label: 'Booking sekarang' } }
    }
    case 'TANYA_JADWAL':
      return { reply: 'Sebutkan tanggal yang ingin dicek, atau lihat kalender di halaman booking.', action: { type: 'BOOK', label: 'Cek jadwal' } }
    case 'BOOKING':
      return { reply: 'Untuk memesan, pilih paket, tanggal, dan jam di halaman booking.', action: { type: 'BOOK', label: 'Mulai booking' } }
    case 'KEMITRAAN':
      return { reply: 'Campose terbuka untuk kemitraan franchise. Isi formulir kemitraan dan tim kami akan menghubungi kamu.', action: { type: 'PARTNERSHIP_FORM', label: 'Isi formulir' } }
    default:
      return { reply: 'Maaf, aku belum bisa membantu itu. Hubungi CS kami lewat WhatsApp ya.', action: wa }
  }
}

export async function handleChat(message: string, sessionId?: string) {
  const session = sessionId
    ? await prisma.chatSession.upsert({ where: { id: sessionId }, update: {}, create: { id: sessionId } })
    : await prisma.chatSession.create({ data: {} })

  let result: Result
  if (AI_URL) {
    // Alur sesuai kontrak: classify-intent -> (rag/answer untuk intent produk)
    const cls = await callAi<{ intent: Intent; confidence: number }>('/classify-intent', { text: message })
    if (cls.intent === 'LAINNYA' || cls.intent === 'KELUHAN') {
      result = { ...(await fallbackReply(cls.intent)), intent: cls.intent, confidence: cls.confidence }
    } else {
      const history = await prisma.chatMessage.findMany({ where: { sessionId: session.id }, orderBy: { id: 'desc' }, take: 6 })
      const rag = await callAi<{ answer: string }>('/rag/answer', {
        question: message,
        intent: cls.intent,
        history: history.reverse().map((h) => ({ role: h.role === 'bot' ? 'assistant' : 'user', content: h.content })),
      })
      const base = await fallbackReply(cls.intent)
      result = { reply: rag.answer, action: base.action, intent: cls.intent, confidence: cls.confidence }
    }
  } else {
    const intent = keywordIntent(message)
    result = { ...(await fallbackReply(intent)), intent, confidence: 1 }
  }

  await prisma.chatMessage.createMany({
    data: [
      { sessionId: session.id, role: 'user', content: message, intent: result.intent, confidence: result.confidence },
      { sessionId: session.id, role: 'bot', content: result.reply },
    ],
  })
  return { sessionId: session.id, ...result }
}
