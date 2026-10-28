export const PACKAGES = [
  { id: 0, title: '2 Jam', hours: 2, price: 1299000, color: '#FF5FBF', pos: 0 },
  { id: 1, title: '4 Jam', hours: 4, price: 2199000, color: '#C26AE8', pos: 53, popular: true },
  { id: 2, title: '8 Jam', hours: 8, price: 4099000, color: '#FF5A5A', pos: 100 },
]
export const FEATURES = [
  { t: 'Unlimited Photo Prints', d: 'Cetak foto tanpa batas selama sesi berlangsung.' },
  { t: 'Custom Experience', d: 'Free template design, fun props, dan custom photostrip.' },
  { t: 'Instant Digital Memories', d: 'Foto digital, GIF, dan akses hasil foto via link tersedia.' },
]

export const ADDONS: [string, number][] = [
  ['Bebas Kostum Onesie/Hanbok', 15000], ['Seluruh file foto edit (Gdrive)', 10000], ['Tambah background', 30000], ['Tambah orang (per orang)', 25000],
  ['Tambah waktu (per 10 menit)', 25000], ['Cetak 4R warna', 10000], ['Cetak 10RS/A4 warna', 25000], ['Figura 4R (per pcs)', 15000],
  ['Figura 10RS/A4 (per pcs)', 49000], ['Bawa hewan (per hewan)', 25000], ['Tambahan desain kolase', 5000],
]
export const VOUCHERS: Record<string, number> = { CAMPOSE10: 100000 }
