# Campose - Kontrak API v1

Disepakati tim A26-CS263 (Full-Stack, AI Engineer, Data Scientist) **sebelum** coding.
Perubahan kontrak = update file ini + kabari tim.

Base URL: `/api/v1` (Express). Layanan AI/DS (FastAPI) hanya dipanggil oleh Express, **tidak oleh frontend**.

## Konvensi

- Format JSON, nama field `camelCase`, uang dalam rupiah (integer), tanggal `YYYY-MM-DD`.
- Respons sukses: `{ "success": true, "data": ... }`
- Respons gagal: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`
- Auth admin: header `Authorization: Bearer <JWT>`.
- Total harga **selalu dihitung backend** (frontend hanya menampilkan).

## Kode error

| HTTP | code | Arti |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Input tidak valid |
| 401 | `UNAUTHORIZED` | Belum login / token salah |
| 403 | `FORBIDDEN` | Role tidak punya akses |
| 404 | `NOT_FOUND` | Data tidak ada |
| 409 | `SLOT_TAKEN` | Tanggal/jam sudah dibooking |
| 422 | `VOUCHER_INVALID` | Voucher salah / kedaluwarsa / kuota habis |
| 429 | `RATE_LIMITED` | Terlalu banyak request (chat) |
| 502 | `AI_SERVICE_ERROR` | Layanan AI gagal |
| 503 | `AI_QUOTA_EXCEEDED` | Kuota API LLM habis / AI lambat |
| 500 | `INTERNAL_ERROR` | Error server |

---

## 1. Publik (tanpa login)

### Katalog

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/packages` | Daftar paket aktif |
| GET | `/addons` | Daftar add-on aktif |
| GET | `/reviews` | Review yang `isPublished` |

`GET /packages` →
```json
{ "success": true, "data": [
  { "id": 1, "name": "4 Jam", "hours": 4, "price": 2199000, "isPopular": true }
] }
```

### Jadwal

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/availability?month=2026-07` | Status tiap tanggal dalam sebulan |
| GET | `/availability/slots?date=2026-07-18&packageId=1` | Jam mulai yang masih kosong |

```json
// GET /availability?month=2026-07
{ "success": true, "data": [ { "date": "2026-07-18", "status": "TERSEDIA" } ] }
// GET /availability/slots
{ "success": true, "data": { "date": "2026-07-18", "slots": [ { "start": "09.00", "available": true } ] } }
```

**Aturan ketersediaan (disepakati):**
- Jam dianggap terisi jika ada booking `TERKONFIRMASI` (DP sudah dibayar) yang rentang waktunya tumpang tindih: `[startTime, endTime)`, dengan `endTime = startTime + durasi paket`.
- Booking `MENUNGGU_PEMBAYARAN` **menahan slot sementara** sampai `paymentDeadline`. Lewat batas → status `DIBATALKAN` dan slot terbuka lagi.
- Status tanggal: `TERSEDIA` (masih ada slot), `DIBOOKING` (sebagian terisi), `PENUH` (tidak ada slot tersisa), plus override admin dari tabel `Availability`.
- `POST /bookings` mengecek slot di dalam transaksi database; bentrok → `409 SLOT_TAKEN`.

### Voucher & Booking

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/vouchers/validate` | Cek voucher |
| POST | `/bookings/quote` | Hitung harga (tanpa menyimpan) |
| POST | `/bookings` | Buat booking → status `MENUNGGU_PEMBAYARAN` |
| GET | `/bookings/:code` | Detail / invoice (untuk halaman invoice & status) |
| POST | `/bookings/:code/payments` | Buat pembayaran DP |
| GET | `/payments/:id` | Status pembayaran (polling) |

`POST /vouchers/validate`
```json
// request
{ "code": "CAMPOSE10" }
// response
{ "success": true, "data": { "code": "CAMPOSE10", "discountAmount": 100000 } }
```

`POST /bookings/quote` dan `POST /bookings` (body sama)
```json
{
  "packageId": 1,
  "eventDate": "2026-07-18",
  "startTime": "09.00",
  "location": "Bogor",
  "eventType": "Pernikahan",
  "eventName": "Pernikahan Andi & Sari",
  "guestCount": 150,
  "organization": null,
  "notes": "",
  "customer": { "name": "Andi Wijaya", "email": "andi@mail.com", "whatsapp": "08123456789" },
  "addons": [ { "addonId": 4, "qty": 2 } ],
  "voucherCode": "CAMPOSE10"
}
```
Response `POST /bookings` (201):
```json
{ "success": true, "data": {
  "code": "CMP-2026-0001", "status": "MENUNGGU_PEMBAYARAN",
  "packageName": "4 Jam", "eventDate": "2026-07-18", "startTime": "09.00", "endTime": "13.00",
  "subtotal": 2249000, "discount": 100000, "total": 2149000,
  "paymentDeadline": "2026-07-10T12:00:00Z"
} }
```

`POST /bookings/:code/payments`
```json
// request
{ "method": "QRIS" }
// response
{ "success": true, "data": { "id": "pay_x", "method": "QRIS", "amount": 2149000, "status": "PENDING",
  "qrisUrl": "...", "expiresAt": "..." } }
```
> Prototipe: pembayaran disimulasikan. Endpoint khusus demo `POST /payments/:id/simulate-paid` (nonaktif di production).

### Chatbot & lead

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/chat` | Kirim pesan ke asisten |
| GET | `/chat/sessions/:sessionId` | Riwayat percakapan |
| POST | `/partnership-leads` | Form calon mitra franchise |
| POST | `/analytics/visit` | Catat kunjungan halaman |

`POST /chat`
```json
// request
{ "sessionId": "optional-uuid", "message": "harga paket 4 jam berapa?" }
// response
{ "success": true, "data": {
  "sessionId": "...", "reply": "Paket 4 Jam Rp2.199.000 ...",
  "intent": "TANYA_HARGA", "confidence": 0.93,
  "action": { "type": "BOOK", "label": "Booking sekarang" }
} }
```
`action.type`: `BOOK` | `WHATSAPP` | `PARTNERSHIP_FORM` | `NONE`.
Di luar konteks usaha → `intent: "LAINNYA"` + penolakan sopan.

---

## 2. Admin (JWT)

| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| POST | `/auth/login` | - | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | semua | Profil admin |
| GET | `/admin/bookings?status=&from=&to=&q=&page=&limit=` | semua | Daftar booking + pencarian |
| GET | `/admin/bookings/:code` | semua | Detail |
| PATCH | `/admin/bookings/:code/status` | OWNER, ADMIN | `{ "status": "TERKONFIRMASI" }` |
| GET | `/admin/availability?month=` | semua | Kalender & jadwal |
| PUT | `/admin/availability/:date` | OWNER, ADMIN | Override status tanggal |
| GET | `/admin/payments` | OWNER, ADMIN | Daftar pembayaran & invoice |
| GET/POST/PATCH/DELETE | `/admin/vouchers` | OWNER, ADMIN | CRUD voucher |
| GET/POST/PATCH | `/admin/packages`, `/admin/addons` | OWNER | Kelola harga |
| GET/PATCH | `/admin/reviews` | OWNER, ADMIN | Moderasi review |
| GET | `/admin/partnership-leads` | semua | Daftar calon mitra |
| GET | `/admin/chat/sessions` | semua | Log percakapan |

### Dashboard

| Method | Endpoint | Isi |
|---|---|---|
| GET | `/admin/dashboard/summary?month=2026-06` | Total booking, menunggu pembayaran, event terkonfirmasi, pendapatan |
| GET | `/admin/dashboard/bookings-per-month?months=12` | Deret waktu (grafik garis) |
| GET | `/admin/dashboard/package-share` | Proporsi paket (donut) |
| GET | `/admin/dashboard/upcoming?days=7` | Event mendatang |
| GET | `/admin/dashboard/traffic?from=&to=` | Kunjungan, sumber (referrer), perangkat |
| GET | `/admin/dashboard/inquiry-insights?from=&to=` | Jumlah inquiry per intent, pertanyaan teratas, konversi inquiry→booking |

```json
// GET /admin/dashboard/summary
{ "success": true, "data": { "totalBookings": 11, "awaitingPayment": 3, "confirmedEvents": 4, "revenue": 23837100 } }
// GET /admin/dashboard/bookings-per-month
{ "success": true, "data": [ { "month": "2025-07", "count": 14 }, { "month": "2025-08", "count": 18 } ] }
// GET /admin/dashboard/package-share
{ "success": true, "data": [ { "package": "4 Jam", "count": 5, "percent": 45 } ] }
```

### Data Science

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/admin/inquiries/import` | Unggah CSV (`message,intent,source,isDummy`) |
| GET | `/admin/inquiries/export?format=csv` | Ekspor dataset untuk tim DS |

---

## 3. Layanan AI / DS (FastAPI) - hanya dipanggil Express

Base URL: `AI_SERVICE_URL` (env). Header: `X-Internal-Key`.

| Method | Endpoint | Pemilik |
|---|---|---|
| GET | `/health` | AI |
| POST | `/classify-intent` | Data Science |
| POST | `/rag/answer` | AI Engineer |
| POST | `/rag/reindex` | AI Engineer (muat ulang knowledge base) |

`POST /classify-intent`
```json
// request
{ "text": "harga paket 4 jam berapa?" }
// response
{ "intent": "TANYA_HARGA", "confidence": 0.93, "modelVersion": "logreg-v1" }
```
`intent` ∈ `TANYA_HARGA | TANYA_JADWAL | BOOKING | KEMITRAAN | KELUHAN | LAINNYA`.

`POST /rag/answer`
```json
// request
{ "question": "harga paket 4 jam berapa?", "intent": "TANYA_HARGA",
  "history": [ { "role": "user", "content": "halo" } ] }
// response
{ "answer": "Paket 4 Jam Rp2.199.000 ...", "sources": ["faq-harga"], "outOfScope": false }
```

Alur `/chat` di Express:
1. Simpan pesan user → panggil `/classify-intent`.
2. `LAINNYA`/`KELUHAN` → balasan template (atau arahkan ke WhatsApp CS).
3. Selain itu → panggil `/rag/answer`.
4. Simpan balasan + intent di `ChatMessage`, kembalikan ke frontend.
5. FastAPI gagal / kuota habis → `502` / `503` dengan pesan ramah + tombol WhatsApp.

---

## Catatan untuk tim

- **Data Science**: sumber data `Inquiry` (CSV import) + `Booking`. Data dummy wajib `isDummy = true` dan dijelaskan cara pembuatannya di README.
- **AI Engineer**: knowledge base dari harga/FAQ/kemitraan Campose; harga diambil dari `/packages` agar tidak beda dengan website.
- **Full-Stack**: validasi semua body dengan Zod, dokumentasikan di Swagger (`/api/docs`).
- Data photobox **tidak** dipakai di dashboard booking photobooth.
