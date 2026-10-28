import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.package.deleteMany()
  await prisma.package.createMany({
    data: [
      { name: '2 Jam', hours: 2, price: 1299000 },
      { name: '4 Jam', hours: 4, price: 2199000, isPopular: true },
      { name: '8 Jam', hours: 8, price: 4099000 },
    ],
  })

  await prisma.addon.deleteMany()
  await prisma.addon.createMany({
    data: [
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
    ],
  })

  await prisma.voucher.upsert({
    where: { code: 'CAMPOSE10' },
    update: {},
    create: { code: 'CAMPOSE10', discountAmount: 100000 },
  })
  console.log('Seed selesai')
}

main().finally(() => prisma.$disconnect())
