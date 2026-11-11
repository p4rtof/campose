import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ── Packages (Upsert safe, tidak deleteMany agar tidak melanggar foreign key constraint) ──
  const packagesData = [
    { name: '2 Jam', hours: 2, price: 1299000, isPopular: false },
    { name: '4 Jam', hours: 4, price: 2199000, isPopular: true },
    { name: '8 Jam', hours: 8, price: 4099000, isPopular: false },
  ]

  for (const pkg of packagesData) {
    const existing = await prisma.package.findFirst({
      where: {
        OR: [
          { name: pkg.name },
          { hours: pkg.hours },
        ],
      },
    })

    if (existing) {
      await prisma.package.update({
        where: { id: existing.id },
        data: {
          name: pkg.name,
          hours: pkg.hours,
          price: pkg.price,
          isPopular: pkg.isPopular,
          isActive: true,
        },
      })
    } else {
      await prisma.package.create({
        data: pkg,
      })
    }
  }

  // ── Addons (Upsert safe) ──
  const addonsData = [
    { name: 'Bebas Kostum Onesie/Hanbok', price: 15000 },
    { name: 'Seluruh file foto edit (Gdrive)', price: 10000 },
    { name: 'Tambah background', price: 30000 },
    { name: 'Tambah orang', price: 25000, unit: 'per orang' },
    { name: 'Tambah waktu', price: 25000, unit: 'per 10 menit' },
    { name: 'Cetak 4R warna', price: 10000 },
    { name: 'Cetak 10RS/A4 warna', price: 25000 },
    { name: 'Figura 4R', price: 15000, unit: 'per pcs' },
    { name: 'Figura 10RS/A4', price: 49000, unit: 'per pcs' },
    { name: 'Bawa hewan', price: 25000, unit: 'per hewan' },
    { name: 'Tambahan desain kolase', price: 5000 },
  ]

  for (const addon of addonsData) {
    const existing = await prisma.addon.findFirst({
      where: { name: addon.name },
    })

    if (existing) {
      await prisma.addon.update({
        where: { id: existing.id },
        data: {
          price: addon.price,
          unit: addon.unit || null,
          isActive: true,
        },
      })
    } else {
      await prisma.addon.create({
        data: addon,
      })
    }
  }

  // ── Voucher ──
  await prisma.voucher.upsert({
    where: { code: 'CAMPOSE10' },
    update: { isActive: true },
    create: { code: 'CAMPOSE10', discountAmount: 100000 },
  })

  // ── Admin default ──
  const passwordHash = await bcrypt.hash('admin123', 12)
  await prisma.adminUser.upsert({
    where: { email: 'admin@campose.id' },
    update: { passwordHash },
    create: {
      name: 'Admin Campose',
      email: 'admin@campose.id',
      passwordHash,
      role: 'OWNER',
    },
  })

  // ── Terms & Conditions ──
  const defaultTerms = [
    'Pemesanan dianggap sah setelah bukti pembayaran DP diverifikasi dan di-ACC oleh admin.',
    'Reschedule maksimal 1x dan diajukan paling lambat H-3 sebelum acara, selebihnya dikenakan biaya.',
    'Waktu layanan dihitung sejak photobooth siap digunakan di lokasi acara.',
    'Keterlambatan akses venue akan mengurangi durasi layanan photobooth.',
    'Pelunasan dilakukan sesuai batas waktu yang tertera pada invoice pembayaran.',
    'Dengan melakukan pemesanan, pemesan dianggap telah menyetujui seluruh syarat dan ketentuan yang berlaku.',
  ]
  await prisma.setting.upsert({
    where: { key: 'terms' },
    update: {},
    create: {
      key: 'terms',
      value: JSON.stringify(defaultTerms),
    },
  })

  console.log('✅ Seed selesai')
  console.log('   Admin: admin@campose.id | Password: admin123')
}

main().finally(() => prisma.$disconnect())
