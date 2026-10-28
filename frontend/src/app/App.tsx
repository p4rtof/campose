import { useCallback, useEffect, useState, type ComponentType } from 'react'
import { usePath } from '@/lib/router'
import { BookingCtx, emptyBooking, type Booking } from '@/features/booking/booking-state'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Assistant } from '@/features/chat/Assistant'
import { HomePage } from '@/pages/HomePage'
import { FaqPage } from '@/pages/FaqPage'
import { KemitraanPage } from '@/pages/KemitraanPage'
import { PhotoboxPage } from '@/pages/PhotoboxPage'
import { BookingPage } from '@/pages/booking/BookingPage'
import { DetailPage } from '@/pages/booking/DetailPage'
import { InvoicePage } from '@/pages/booking/InvoicePage'
import { PaymentPage } from '@/pages/booking/PaymentPage'

// Daftar halaman: tambah halaman baru cukup di sini.
const ROUTES: Record<string, ComponentType> = {
  '/': HomePage,
  '/booking-photobooth': BookingPage,
  '/detail-pesanan': DetailPage,
  '/invoice': InvoicePage,
  '/pembayaran': PaymentPage,
  '/faq': FaqPage,
  '/kemitraan': KemitraanPage,
  '/photobox': PhotoboxPage,
}

export default function App() {
  const path = usePath()
  const [b, setB] = useState<Booking>(emptyBooking)
  const set = useCallback((p: Partial<Booking>) => setB((x) => ({ ...x, ...p })), [])
  useEffect(() => { document.title = 'Campose — Event Photobooth Rental' }, [])
  const Page = ROUTES[path] ?? HomePage
  return (
    <BookingCtx.Provider value={{ b, set }}>
      <Navbar path={path} />
      <main><Page /></main>
      <Footer />
      <Assistant />
    </BookingCtx.Provider>
  )
}
