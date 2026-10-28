# Campose

Website portfolio + booking photobooth + AI Assistant (capstone Asah 2026, tim A26-CS263).

## Struktur

```
campose/
├─ frontend/   React + Vite + Tailwind  (http://localhost:5173)
├─ backend/    Express + TypeScript + Prisma + PostgreSQL  (http://localhost:4000/api/v1)
├─ ai-service/ (nanti) FastAPI: RAG chatbot + classifier intent
└─ docs/       API-CONTRACT.md, schema.prisma
```

### frontend/src
| Folder | Isi |
|---|---|
| `app/` | `App.tsx` (daftar halaman/route) |
| `pages/` | Satu file per halaman; `pages/booking/` untuk alur pesan |
| `features/` | `booking/` (state, FlowSteps), `chat/` (Assistant) |
| `components/` | Komponen umum: Icon, Brand, `layout/` Navbar & Footer |
| `data/` | Data statis sementara (paket, add-on, jadwal) |
| `lib/` | router, format, image, `api.ts` (Axios ke backend) |

### backend/src
`routes/` (endpoint) → `services/` (logika bisnis: harga, slot, booking, pembayaran, chat) → `prisma/`.
`schemas/` validasi Zod, `middlewares/` validasi + error handler.

## Menjalankan

```bash
npm install          # pasang semua (root, frontend, backend)
npm run dev          # frontend + backend sekaligus
```

Frontend langsung jalan di http://localhost:5173 tanpa database.

### Mengaktifkan backend (database Neon)
1. Buat project di https://neon.tech, salin connection string.
2. `cp backend/.env.example backend/.env` lalu isi `DATABASE_URL`.
3. `npm run db:push` (buat tabel) lalu `npm run db:seed` (isi paket, add-on, voucher).
4. Cek: http://localhost:4000/api/v1/packages

## Status
- Frontend: tampilan lengkap, **masih memakai data statis** (belum memanggil API).
- Backend: katalog, jadwal, voucher, booking, pembayaran **simulasi**, chat dasar.
- Belum ada: login admin + endpoint dashboard, import inquiry CSV, layanan FastAPI.

## Pembayaran simulasi
`DEMO_MODE=true` mengaktifkan `POST /payments/:id/simulate-paid`. Set `false` saat production.
Logika pembayaran ada di satu file (`backend/src/services/payment.service.ts`) supaya mudah diganti ke Midtrans/Xendit.
