import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/errors.js'

type Db = Pick<typeof prisma, 'package' | 'addon' | 'voucher'>

export async function checkVoucher(code: string, db: Db = prisma) {
  const v = await db.voucher.findUnique({ where: { code: code.trim().toUpperCase() } })
  const now = new Date()
  const bad =
    !v || !v.isActive ||
    (v.validFrom && v.validFrom > now) ||
    (v.validUntil && v.validUntil < now) ||
    (v.quota !== null && v.used >= v.quota)
  if (bad) throw new AppError(422, 'VOUCHER_INVALID', 'Kode voucher tidak valid atau sudah kedaluwarsa.')
  return v!
}

// Harga SELALU dihitung di sini, bukan dipercaya dari frontend.
export async function quote(
  input: { packageId: number; addons: { addonId: number; qty: number }[]; voucherCode?: string | null },
  db: Db = prisma,
) {
  const pkg = await db.package.findFirst({ where: { id: input.packageId, isActive: true } })
  if (!pkg) throw new AppError(404, 'NOT_FOUND', 'Paket tidak ditemukan')

  const addonRows = await db.addon.findMany({ where: { id: { in: input.addons.map((a) => a.addonId) }, isActive: true } })
  const items = input.addons.map((a) => {
    const row = addonRows.find((r) => r.id === a.addonId)
    if (!row) throw new AppError(404, 'NOT_FOUND', `Add-on ${a.addonId} tidak ditemukan`)
    return { addonId: row.id, name: row.name, qty: a.qty, price: row.price }
  })

  const subtotal = pkg.price + items.reduce((s, i) => s + i.price * i.qty, 0)
  const voucher = input.voucherCode ? await checkVoucher(input.voucherCode, db) : null
  const discount = Math.min(voucher?.discountAmount ?? 0, subtotal)
  return { pkg, items, subtotal, discount, total: subtotal - discount, voucherCode: voucher?.code ?? null }
}
