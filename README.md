# Campose – Photobooth Booking Portal & Admin Management System

**Campose** is a full-stack photobooth rental booking platform with real-time admin calendar management, dynamic pricing from database, automated booking confirmations, and payment processing. Built for the Asah 2026 capstone program (Team A26-CS263).

---

## Core Features

### Customer Experience
- **Dynamic Package & Add-on Pricing**: All pricing fetched from database at runtime; no hardcoded values.
- **Real-time Booking Calendar**: Customers view available dates and time slots synchronized with admin overrides.
- **Holiday/Blocked Date Management**: Admins mark dates as "Libur" (holiday); customers cannot select them.
- **Complete Booking Flow**: Package selection → date/time → event details → add-ons → payment method.
- **Automatic Confirmation Emails**: Booking confirmation and payment instructions sent via Nodemailer.

### Admin Dashboard
- **Calendar Availability Overrides**: Mark specific dates as Tersedia, Penuh, or Libur (TERSEDIA, PENUH, LIBUR).
- **Booking Management**: View all bookings, reschedule, cancel, manage payment confirmations.
- **Manual Payment Verification**: Upload payment proofs, admin confirms or rejects manually.
- **Real-time Socket.IO Sync**: Changes propagate instantly to all connected clients (customers & admins).

### Backend Architecture
- **Database-Driven Catalog**: Packages, add-ons, vouchers, availability overrides all managed in PostgreSQL (Supabase).
- **Booking Validation**: Backend validates package availability, blocked dates, pricing at submission time.
- **JWT Authentication**: Secure admin routes with token-based auth.
- **Email Notifications**: Nodemailer integration for confirmations and payment reminders.

---

## 🛠 Tech Stack

### Frontend
- **React 19** + **Vite 8** – Fast build tooling and HMR
- **TypeScript 5** – Type safety
- **Tailwind CSS 4** – Utility-first styling
- **Socket.IO Client 4** – Real-time updates
- **Axios** – HTTP client (optional)

### Backend
- **Express 4** + **TypeScript 5** – RESTful API
- **Prisma 6** – ORM for PostgreSQL
- **PostgreSQL (Supabase)** – Managed database
- **Socket.IO 4** – Real-time event broadcasting
- **JWT (jsonwebtoken)** – Admin authentication
- **Bcryptjs** – Password hashing
- **Nodemailer 10** – Email notifications
- **Helmet** – Security headers
- **CORS** – Cross-origin request handling
- **Zod** – Schema validation
- **Multer** – File upload middleware

### Development
- **tsx** – TypeScript runner for Node.js
- **Concurrently** – Run frontend + backend in parallel
- **Prisma Migrate** – Schema versioning (optional; using db push for development)

---

## Getting Started

### Prerequisites
- **Node.js** 18+ with npm
- **PostgreSQL** database (Supabase recommended for quick setup)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd campose
   ```

2. **Install dependencies (all packages):**
   ```bash
   npm run setup
   ```
   Or manually:
   ```bash
   npm install
   npm install --prefix frontend
   npm install --prefix backend
   ```

3. **Set up environment variables:**

   **Backend (`backend/.env`):**
   ```env
   # Database (Supabase PostgreSQL)
   DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
   DIRECT_URL="postgresql://user:password@host:5432/database"

   # Server
   PORT=4000
   CORS_ORIGIN=http://localhost:5173,http://localhost:5174

   # JWT Secret (change in production)
   JWT_SECRET=your-super-secret-jwt-key

   # Demo Mode (false in production)
   DEMO_MODE=false

   # Email (Nodemailer - Gmail, SendGrid, etc.)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # AI Service (optional)
   AI_SERVICE_URL=http://localhost:8000
   AI_INTERNAL_KEY=your-secret-key
   ```

   **Frontend (`frontend/.env` optional):**
   ```env
   VITE_API_BASE_URL=http://localhost:4000
   ```

4. **Database setup:**
   ```bash
   # Push Prisma schema to database (creates tables)
   npm run db:push

   # Seed default data (packages, add-ons, vouchers, admin user)
   npm run db:seed
   ```

---

## Running the Project

### Development Mode (Frontend + Backend)
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api/v1

### Frontend Only
```bash
npm run dev:web
```

### Backend Only
```bash
npm run dev:api
```

### Production Build
```bash
npm run build
npm start --prefix backend
cd frontend && npm run preview
```

---

## Default Credentials

After running `npm run db:seed`, use these credentials to login to the admin panel:

- **Email:** `admin@campose.id`
- **Password:** `admin123`

 **Change immediately in production.**

---

## Project Structure

```
campose/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── app/               # App.tsx (route definitions)
│   │   ├── pages/             # Page components (booking, admin, etc.)
│   │   ├── features/          # Feature-specific state & components
│   │   ├── components/        # Reusable UI components
│   │   ├── data/              # Static data (FEATURES, VOUCHERS - catalog empty)
│   │   ├── lib/               # Utilities (router, format, API)
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Express + TypeScript + Prisma
│   ├── src/
│   │   ├── index.ts           # Server entry
│   │   ├── app.ts             # Express app & Socket.IO setup
│   │   ├── routes/            # API routes (public & admin)
│   │   ├── services/          # Business logic (booking, pricing, payments)
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── middlewares/       # Auth, validation, error handling
│   │   ├── lib/               # Utilities (Prisma, JWT, time, errors)
│   │   └── uploads/           # Payment proof uploads
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (Packages, Addons, Bookings, etc.)
│   │   └── seed.ts            # Seed script
│   ├── package.json
│   └── tsconfig.json
│
├── ai-service/                  # (Placeholder) FastAPI chatbot service
├── docs/                        # API contracts & additional docs
├── package.json                 # Root workspace scripts
└── README.md                    # This file
```

---

## API Endpoints

### Public Routes (No Auth Required)

**Packages & Catalog:**
- `GET /api/v1/packages` – Fetch active packages
- `GET /api/v1/addons` – Fetch active add-ons
- `GET /api/v1/reviews` – Fetch published reviews
- `GET /api/v1/terms` – Fetch T&C

**Availability & Booking:**
- `GET /api/v1/availability?month=YYYY-MM` – Month status
- `GET /api/v1/availability/slots?date=YYYY-MM-DD&hours=2` – Available time slots
- `GET /api/v1/blocked-dates` – Holiday/blocked dates
- `POST /api/v1/bookings` – Create booking
- `GET /api/v1/bookings/:code` – Get booking details

**Vouchers & Pricing:**
- `GET /api/v1/vouchers/:code` – Validate voucher
- `POST /api/v1/bookings/quote` – Calculate booking total

**Payments:**
- `POST /api/v1/bookings/:code/payments` – Create payment record
- `GET /api/v1/bookings/:code/payment-status` – Check payment status
- `POST /api/v1/payments/:id/upload-proof` – Upload payment proof

### Admin Routes (JWT Auth Required)

**Authentication:**
- `POST /api/v1/admin/auth/login` – Admin login

**Dashboard & Bookings:**
- `GET /api/v1/admin/stats` – Dashboard statistics
- `GET /api/v1/admin/bookings?page=1&limit=100` – List bookings
- `GET /api/v1/admin/bookings/:code` – Booking details
- `PATCH /api/v1/admin/bookings/:code/reschedule` – Reschedule
- `PATCH /api/v1/admin/bookings/:code/cancel` – Cancel
- `POST /api/v1/admin/bookings/manual` – Create manual booking

**Calendar & Availability:**
- `GET /api/v1/admin/availability` – All availability overrides
- `POST /api/v1/admin/availability` – Set date status (TERSEDIA, PENUH, LIBUR)
- `DELETE /api/v1/admin/availability/:date` – Remove override

**Packages & Add-ons:**
- `GET /api/v1/admin/packages` – List all packages
- `PATCH /api/v1/admin/packages/:id` – Update package (name, price, hours, isPopular, isActive)
- `GET /api/v1/admin/addons` – List all add-ons
- `POST /api/v1/admin/addons` – Create add-on
- `PATCH /api/v1/admin/addons/:id` – Update add-on
- `DELETE /api/v1/admin/addons/:id` – Delete add-on

**Vouchers:**
- `GET /api/v1/admin/vouchers` – List vouchers
- `POST /api/v1/admin/vouchers` – Create voucher
- `PUT /api/v1/admin/vouchers/:code` – Update voucher
- `DELETE /api/v1/admin/vouchers/:code` – Delete voucher

**Payments:**
- `POST /api/v1/admin/payments/:id/confirm` – Confirm payment
- `POST /api/v1/admin/payments/:id/reject` – Reject payment
- `GET /api/v1/admin/payments` – List payments
- `GET /api/v1/admin/payments/:id` – Payment details

---

## 🗄 Database Schema

Key tables managed by Prisma:

- **Package** – Photobooth packages (2 Jam, 4 Jam, 8 Jam, etc.)
- **Addon** – Add-on services (costumes, extra prints, etc.)
- **Booking** – Customer bookings with status (MENUNGGU_PEMBAYARAN, TERKONFIRMASI, SELESAI, DIBATALKAN)
- **Payment** – Payment records (status: PENDING, PAID, FAILED, DITOLAK, KEDALUWARSA)
- **Availability** – Calendar overrides (TERSEDIA, PENUH, DIBOOKING, LIBUR)
- **Voucher** – Discount codes
- **Review** – Customer reviews
- **AdminUser** – Admin accounts with JWT auth
- **Setting** – Global settings (T&C, etc.)

See `backend/prisma/schema.prisma` for full schema.

---

## Real-time Events (Socket.IO)

Admins & customers receive instant updates via WebSocket:

- `catalog:updated` – Packages/add-ons/vouchers changed
- `availability:updated` – Calendar dates marked as holiday/full/available
- `booking:created` – New booking submitted
- `payment:confirmed` – Payment verified
- `booking:updated` – Booking rescheduled/cancelled

---

## Email Notifications

The system sends automated emails for:
- **Booking Confirmation** – Invoice, package details, payment instructions
- **Payment Reminder** – If payment deadline approaching
- **Payment Confirmation** – When admin verifies payment

Configure in `backend/.env`:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-specific-password  # For Gmail, use App Password
```

---

## Testing

### Test Admin Calendar Holiday Blocking
1. Login: http://localhost:5173/admin → admin@campose.id / admin123
2. Go to Calendar: http://localhost:5173/admin/kalender
3. Click a date → "Atur" tab → Select "Libur" → Save
4. Verify Supabase: `Availability` table shows `status = 'LIBUR'`
5. Customer booking page should disable that date

### Test Dynamic Pricing
1. Go to: http://localhost:5173/booking-photobooth
2. Admin changes a package price via API or admin panel
3. Customer page reloads → new price displays
4. Socket.IO broadcasts `catalog:updated` in real-time

### Test Booking Submission
1. Select package → date/time → details → add-ons → submit
2. Backend validates:
   - Package exists & is active
   - Date is not blocked (LIBUR)
   - Time slot is free
   - Pricing recalculated from database (client prices ignored)
3. Confirmation email sent
4. Payment record created
5. Admin sees new booking in dashboard

---

## Important Notes

### No Hardcoded Pricing
- All package & add-on prices fetched from database at runtime
- Client calculations verified server-side
- `catalog.ts` contains only static UI text (FEATURES, VOUCHERS empty)

### Holiday/Blocked Dates (LIBUR)
- Admin marks dates as LIBUR via calendar or API
- Customers see them disabled (visual: red/grey highlight)
- Backend rejects bookings on LIBUR dates with error message
- Real-time Socket.IO sync updates all clients

### Security
- Admin routes protected by JWT (Authorization header)
- Passwords hashed with bcryptjs
- Input validated with Zod schemas
- CORS configured for localhost (adjust in production)
- Helmet applied for security headers

### Payment Flow (Manual)
- Current: Manual verification (customer uploads proof, admin confirms/rejects)
- Future: Integrate Midtrans/Xendit for automatic processing
- Logic isolated in `backend/src/services/payment-manual.service.ts`

---

## Troubleshooting

**Issue:** Frontend shows "Failed to load packages"
- Check backend running: `http://localhost:4000/api/v1/packages`
- Verify `.env` DATABASE_URL is correct
- Run `npm run db:seed` to populate data

**Issue:** Calendar dates not marking as LIBUR
- Check browser console for API errors
- Verify JWT token in Authorization header
- Check backend logs for Prisma errors
- Ensure `DateStatus` enum includes LIBUR in schema

**Issue:** Emails not sending
- Check EMAIL_USER and EMAIL_PASS in `.env`
- For Gmail, use [App Password](https://myaccount.google.com/apppasswords)
- Check backend logs for nodemailer errors

**Issue:** Socket.IO not syncing in real-time
- Ensure frontend connects to correct BASE_URL
- Check browser WebSocket connection
- Verify CORS_ORIGIN in backend `.env`

---

## Environment Checklist

Before deploying to production:
- [ ] Change `JWT_SECRET` to strong random string
- [ ] Set `DEMO_MODE=false`
- [ ] Update `CORS_ORIGIN` to production domain
- [ ] Configure `EMAIL_USER` and `EMAIL_PASS`
- [ ] Use managed PostgreSQL (Supabase, RDS, etc.)
- [ ] Change default admin credentials
- [ ] Enable HTTPS for all endpoints
- [ ] Configure rate limiting & DDoS protection
- [ ] Set up monitoring & logging

---

## Support & Contribution

For questions or issues, refer to:
- API Contract: `docs/API-CONTRACT.md`
- Database Schema: `backend/prisma/schema.prisma`
- Feature Branch: Check git history for latest changes

---

## License

Campose © 2026 Asah Program Team A26-CS263. All rights reserved.

---

**Happy booking!**
