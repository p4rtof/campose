import { useEffect, useState } from 'react'
import { io as socketIO } from 'socket.io-client'
import { Icon } from '@/components/Icon'
import { FEATURES } from '@/data/catalog'
import { WA } from '@/data/config'
import { FlowSteps } from '@/features/booking/FlowSteps'
import { useBooking } from '@/features/booking/booking-state'
import { fmt } from '@/lib/format'
import { occ } from '@/lib/image'
import { navigate } from '@/lib/router'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://campose-production-0a2aea92.up.railway.app/api/v1';

type Package = {
  id: number
  name: string
  hours: number
  price: number
  isPopular: boolean
  isActive: boolean
}

type DynamicPackage = {
  id: number
  dbId: number
  title: string
  hours: number
  price: number
  color: string
  popular: boolean
}

export function BookingPage() {
  const { set } = useBooking()
  const [packages, setPackages] = useState<DynamicPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPackages = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/api/v1/packages`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      
      if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
        throw new Error('No packages available from server')
      }

      const colors = ['#FF5FBF', '#C26AE8', '#FF5A5A']
      const mapped: DynamicPackage[] = json.data.map((item: Package, idx: number) => ({
        id: idx,
        dbId: item.id,
        title: item.name || `${item.hours} Jam`,
        hours: item.hours,
        price: item.price,
        color: colors[idx % colors.length],
        popular: Boolean(item.isPopular),
      }))
      setPackages(mapped)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load packages'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPackages()

    const socket = socketIO(BASE_URL, { 
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })
    
    socket.on('connect', () => {
      console.log('[BookingPage] Socket.IO connected')
    })
    
    socket.on('connect_error', (err) => {
      console.warn('[BookingPage] Socket.IO connection error:', err.message)
    })
    
    socket.on('catalog:updated', (data: any) => {
      if (!data || data.type === 'packages') {
        loadPackages()
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  if (loading) {
    return (
      <section className="bg-white py-10 md:py-16 md:min-h-[900px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <FlowSteps step={0} />
          <div className="text-center mt-8 md:mt-12">
            <p className="eyebrow">Pilih Paket</p>
            <h1 className="mt-3 text-[28px] md:text-5xl font-extrabold uppercase text-brand">
              Event Photobooth <span className="text-royal">Pricelist</span>
            </h1>
          </div>
          <div className="mt-8 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl md:rounded-[28px] bg-slate-200 h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="bg-white py-10 md:py-16 md:min-h-[900px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <FlowSteps step={0} />
          <div className="text-center mt-8 md:mt-12">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <p className="text-red-800 font-semibold">Failed to load packages</p>
              <p className="text-red-600 text-sm mt-2">{error}</p>
              <button
                onClick={() => loadPackages()}
                className="btn btn-primary mt-4"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (packages.length === 0) {
    return (
      <section className="bg-white py-10 md:py-16 md:min-h-[900px]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <FlowSteps step={0} />
          <div className="text-center mt-8 md:mt-12">
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
              <p className="text-yellow-800 font-semibold">No packages available</p>
              <p className="text-yellow-600 text-sm mt-2">Please try again later or contact support</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white py-10 md:py-16 md:min-h-[900px]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <FlowSteps step={0} />
        <div className="text-center mt-8 md:mt-12">
          <p className="eyebrow">Pilih Paket</p>
          <h1 className="mt-3 text-[28px] md:text-5xl font-extrabold uppercase text-brand">
            Event Photobooth <span className="text-royal">Pricelist</span>
          </h1>
        </div>
        <div className="mt-8 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {packages.map((p) => (
            <article
              key={p.dbId}
              className="relative rounded-2xl md:rounded-[28px] overflow-hidden bg-white text-ink border-2 border-brand flex flex-col shadow-[0_24px_50px_-28px_rgba(26,118,210,.7)] hover:-translate-y-2 transition duration-300"
            >
              <div className="relative">
                <div className="grayscale" style={occ(p.id)} />
                <span
                  className="absolute top-4 left-4 px-5 py-2 rounded-xl font-extrabold text-xl bg-white text-brand border-[3px]"
                  style={{ borderColor: p.color }}
                >
                  {p.title}
                </span>
                {p.popular && (
                  <span className="absolute top-4 right-4 bg-royal text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-full">
                    Paling Populer
                  </span>
                )}
              </div>
              <div className="p-7 flex-1 flex flex-col">
                <div
                  className="self-start px-5 py-2 rounded-lg text-2xl font-extrabold text-brand bg-white border-2 border-brand -mt-12 relative shadow-lg"
                  style={{ borderBottom: `5px solid ${p.color}` }}
                >
                  {fmt(p.price).replace('Rp', 'Rp ')}
                </div>
                <ul className="mt-6 space-y-4 flex-1">
                  {FEATURES.map((f) => (
                    <li key={f.t} className="flex gap-3">
                      <span
                        className="mt-1 w-5 h-5 rounded-full grid place-items-center shrink-0"
                        style={{ background: p.color }}
                      >
                        <Icon n="check" s={12} />
                      </span>
                      <span className="text-sm leading-relaxed text-ink/70">
                        <b className="block text-ink text-[15px]">{f.t}</b>
                        {f.d}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    set({ pkg: p.dbId })
                    navigate('/detail-pesanan')
                  }}
                  className="btn btn-primary mt-8 !h-14 w-full text-base cursor-pointer"
                >
                  Pesan Sekarang
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 md:mt-12 card px-5 md:px-8 py-5 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-3xl mx-auto">
          <p className="font-semibold">
            Butuh durasi custom? <span className="text-royal">Hubungi kami</span>
          </p>
          <a href={WA} target="_blank" className="btn btn-outline !h-12 md:!h-11">
            <Icon n="chat" s={18} /> WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}

