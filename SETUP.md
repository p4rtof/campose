# 🚀 Cara Menjalankan Campose (Full Stack)

## Prerequisites
- Node.js 18+
- PostgreSQL (sudah running di localhost:5432)
- Database: `campose_db` sudah dibuat

## 1. Setup Database

Pastikan PostgreSQL sudah running, lalu jalankan:

```powershell
cd backend

# Push schema ke database
npx prisma db push

# Seed data (packages, addons, voucher, dan admin default)
npm run db:seed
```

**Default Admin:**
- Email: `admin@campose.id`
- Password: `admin123`

## 2. Jalankan Backend

```powershell
cd backend
npm run dev
```

Backend berjalan di: `http://localhost:4000`

## 3. Jalankan Frontend

```powershell
cd frontend
npm run dev
```

Frontend berjalan di: `http://localhost:5173`

## 4. Akses Admin Dashboard

Buka browser: `http://localhost:5173/admin`

---

## Alur Pembayaran Manual

```
Customer → Booking → Invoice → Transfer ke rekening yang tertera
         → Upload foto/screenshot bukti bayar
         → Admin terima notifikasi realtime (Socket.IO)
         → Admin review bukti di dashboard /admin
         → Admin klik Konfirmasi / Tolak
         → Customer status berubah otomatis (polling 5 detik)
```

## API Endpoints Baru

### Customer
- `POST /api/v1/bookings/:code/payments` — buat/ambil payment
- `GET  /api/v1/bookings/:code/payment-status` — cek status (polling)
- `POST /api/v1/payments/:id/upload-proof` — upload bukti (multipart/form-data, field: `proof`)

### Admin (semua butuh `Authorization: Bearer <token>`)
- `POST /api/v1/admin/auth/login` — login admin
- `GET  /api/v1/admin/stats` — statistik dashboard
- `GET  /api/v1/admin/bookings` — list booking (query: page, limit, status)
- `GET  /api/v1/admin/bookings/:code` — detail booking
- `POST /api/v1/admin/payments/:id/confirm` — konfirmasi pembayaran
- `POST /api/v1/admin/payments/:id/reject` — tolak pembayaran (body: `adminNote`)
- `GET  /api/v1/admin/payments` — list semua payment

### Socket.IO Events
- Admin emit `admin:join` (token) → bergabung ke room admin
- Server emit ke admin:
  - `payment:proof_uploaded` — customer baru upload bukti
  - `payment:confirmed` — admin konfirmasi
  - `payment:rejected` — admin tolak
