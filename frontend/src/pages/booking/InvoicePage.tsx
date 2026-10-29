import { useEffect, useState, useRef } from 'react'
import { Logo } from '@/components/Brand'
import { Icon } from '@/components/Icon'
import { WA } from '@/data/config'
import { FlowSteps } from '@/features/booking/FlowSteps'
import { resolved, useBooking, useCountdown } from '@/features/booking/booking-state'
import { fmt } from '@/lib/format'
import { navigate } from '@/lib/router'
import { toPng } from 'html-to-image' // <-- Ganti import ini
import jsPDF from 'jspdf'

export function InvoicePage() {
  const { b } = useBooking()
  const r = resolved(b)
  const cd = useCountdown(23 * 3600 + 59 * 60 + 41)
  const [isDownloading, setIsDownloading] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)
  // Tambahkan di dalam komponen InvoicePage
  const queryParams = new URLSearchParams(window.location.search)
  const invoiceCode = queryParams.get('code') || 'CMP-0001'

  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between gap-4 md:gap-6 py-2 text-sm">
      <span className="text-ink/55 shrink-0">{k}</span>
      <span className="font-semibold text-right break-words min-w-0">{v}</span>
    </div>
  )

  const downloadPDF = async () => {
    if (!invoiceRef.current) return
    setIsDownloading(true)

    try {
      const el = invoiceRef.current

      // Ambil dimensi asli seluruh konten agar tidak terpotong layout responsive
      const width = el.scrollWidth
      const height = el.scrollHeight

      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        width: width,
        height: height,
        style: {
          transform: 'none',
          margin: '0',
          maxWidth: 'none',
          width: `${width}px`,
          height: `${height}px`,
        },
        filter: (node) => {
          if (node?.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) {
            return false
          }
          return true
        },
      })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 10 // Margin 10mm di tepi kertas A4
      const printWidth = pageWidth - margin * 2

      const imgProps = pdf.getImageProperties(dataUrl)
      const printHeight = (imgProps.height * printWidth) / imgProps.width

      pdf.addImage(dataUrl, 'PNG', margin, margin, printWidth, printHeight)
      pdf.save(`Invoice_Campose_#${invoiceCode}.pdf`)
    } catch (error) {
      console.error('Gagal membuat PDF', error)
      alert('Maaf, gagal mengunduh invoice.')
    } finally {
      setIsDownloading(false)
    }
  }
  return (
    <section className="silk-light py-8 md:py-12 md:min-h-[900px]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <FlowSteps step={2} />

        {/* Area ini yang bakal di-convert ke PDF */}
        <div ref={invoiceRef} className="mt-8 md:mt-10 max-w-[860px] mx-auto card overflow-hidden bg-white">
          <div className="bg-brand text-white px-5 py-6 md:px-10 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Logo light size={36} />
              <div className="mt-5 text-xs uppercase tracking-[.2em] text-white/75">Invoice</div>
              <h1 className="text-3xl md:text-4xl font-extrabold">#{invoiceCode}1</h1>
            </div>
            {/* Sembunyikan badge status saat di-download jadi PDF biar lebih formal (opsional) */}
            <span data-html2canvas-ignore className="bg-[#FFF4D6] text-[#9a6700] font-semibold text-sm px-4 py-2 rounded-full flex items-center gap-2 self-start">
              <i className="w-2 h-2 rounded-full bg-[#f5a524] animate-pulse" />Menunggu Pembayaran
            </span>
          </div>

          <div className="p-5 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <h2 className="eyebrow mb-2">Data Pemesan</h2>
              <Row k="Nama" v={r.nama} />
              <Row k="Email" v={r.email} />
              <Row k="WhatsApp" v={r.wa} />
              <Row k="Tanggal terbit" v="12 Juli 2026" />
            </div>
            <div>
              <h2 className="eyebrow mb-2">Detail Pesanan</h2>
              <Row k="Paket" v={`Photobooth ${r.pkg.title}`} />
              <Row k="Tanggal" v={r.date} />
              <Row k="Jam" v={r.range} />
              <Row k="Lokasi" v={r.lokasi} />
            </div>
          </div>

          <div className="mx-5 md:mx-10 rounded-2xl bg-[#f6faff] p-4 md:p-6 mb-6">
            <h2 className="eyebrow mb-2">Rincian Harga</h2>
            <Row k={`Paket Photobooth ${r.pkg.title}`} v={fmt(r.pkg.price)} />
            {r.addons.map(([n, pr, q]) => (
              <Row key={n} k={`Add-on: ${n}${q > 1 ? ` × ${q}` : ''}`} v={fmt(pr)} />
            ))}
            <Row k="Biaya transport Jabodetabek" v="Gratis" />
            {r.discount > 0 && (
              <div className="flex justify-between py-2 text-sm font-semibold text-[#16a34a]">
                <span>Diskon Voucher ({r.voucher})</span>
                <span>-{fmt(r.discount)}</span>
              </div>
            )}
            <div className="mt-3 pt-4 border-t-2 border-dashed border-[#bcd5f2] flex justify-between items-end">
              <span className="font-semibold">Total</span>
              <span className="text-3xl font-extrabold text-royal">{fmt(r.total)}</span>
            </div>
          </div>

          {/* Tombol aksi kita sembunyikan (ignore) pas html2canvas nge-render */}
          <div data-html2canvas-ignore>
            <div className="mx-5 md:mx-10 mt-6 rounded-2xl bg-[#F3F6FB] border border-[#d6e4f5] text-ink px-4 md:px-6 py-4 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm font-medium">
                <Icon n="clock" className="text-brand" /> Batas waktu pembayaran
              </div>
              <div className="flex gap-2 font-extrabold text-2xl tabular-nums">
                {[cd.h, cd.m, cd.s].map((x, i) => (
                  <span key={i} className="bg-white text-brand border border-[#d6e4f5] rounded-lg px-3 py-1">{x}</span>
                ))}
              </div>
            </div>

            <div className="p-5 md:p-10 flex flex-col md:flex-row gap-3 md:gap-4">
              <button onClick={() => navigate(`/pembayaran?code=${invoiceCode}`)} className="btn btn-primary !h-14 md:flex-1 text-base">                Bayar Sekarang
              </button>
              <button onClick={downloadPDF} disabled={isDownloading} className={`btn btn-outline !h-14 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Icon n="download" s={18} /> {isDownloading ? 'Menyiapkan PDF...' : 'Download Invoice (PDF)'}
              </button>
              <a href={WA} target="_blank" rel="noreferrer" className="btn btn-outline !h-14">
                <Icon n="chat" s={18} /> Hubungi CS
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}