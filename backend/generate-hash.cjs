/**
 * ============================================================
 *  SCRIPT: Generate Bcrypt Hash untuk Password Admin
 * ============================================================
 *
 * CARA PAKAI:
 * -----------
 * 1. Buka terminal di folder backend/ ini.
 * 2. Ganti nilai PASSWORD_BARU di bawah dengan password yang kamu inginkan.
 * 3. Jalankan perintah berikut:
 *
 *       node generate-hash.cjs
 *
 * 4. Salin (copy) hash yang muncul di terminal.
 * 5. Buka Supabase Table Editor → tabel "Admin" (atau "User").
 * 6. Temukan baris admin kamu, klik Edit, tempel (paste) hash
 *    ke kolom "password", lalu simpan.
 *
 * CATATAN:
 * - File ini menggunakan ekstensi .cjs agar bisa dijalankan dengan
 *   require() meskipun package.json memakai "type": "module".
 * - Setiap kali script dijalankan, hash yang dihasilkan BERBEDA
 *   meskipun password-nya sama. Itu normal (karena bcrypt pakai salt acak).
 * - Gunakan hash yang PALING BARU saja yang kamu paste ke Supabase.
 * ============================================================
 */

const bcrypt = require('bcryptjs')

// ✏️  GANTI INI dengan password baru yang kamu inginkan:
const PASSWORD_BARU = 'iniCampose123'

const SALT_ROUNDS = 10

;(async () => {
  const hash = await bcrypt.hash(PASSWORD_BARU, SALT_ROUNDS)

  console.log('\n✅  Hash berhasil dibuat!')
  console.log('─'.repeat(70))
  console.log(hash)
  console.log('─'.repeat(70))
  console.log('\n👆  Salin baris hash di atas dan paste ke kolom password di Supabase.\n')
})()
