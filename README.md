# Campose

Full-stack photobooth rental booking platform with realtime admin dashboard, database-driven pricing, calendar management, manual payment verification, and automated email notifications.

| | URL |
|---|---|
| Customer site | [campose.web.id](https://campose.web.id) |
| Admin dashboard | [campose.web.id/admin](https://campose.web.id/admin) |
| Backend API | [api.campose.web.id/api/v1](https://api.campose.web.id/api/v1) |

Built for the Asah 2026 capstone program — Team A26-CS263.

---

## Monorepo Structure

```
campose/
├── frontend/       React + Vite SPA (customer booking & admin dashboard)
├── backend/        Express + Prisma REST API & Socket.IO server
├── ai-service/     Placeholder for RAG & chatbot integration (FastAPI)
├── docs/           API contract & schema reference
└── package.json    Root workspace scripts
```

---

## Tech Stack

### Frontend

| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 8 | Build tooling & HMR |
| Tailwind CSS | 4 | Utility-first styling |
| Socket.IO Client | 4 | Realtime updates |
| Axios | 1.7 | HTTP client |

Deployed on **Vercel** (auto-deploy from `main` branch).

### Backend

| Library | Version | Purpose |
|---|---|---|
| Express | 4 | REST API |
| TypeScript | 5 | Type safety |
| Prisma | 6 | PostgreSQL ORM |
| Socket.IO | 4 | Realtime event broadcasting |
| Nodemailer | 10 | SMTP email notifications |
| Zod | 3 | Request schema validation |
| jsonwebtoken | 9 | JWT admin auth |
| bcryptjs | 3 | Password hashing |
| Multer | 2 | File upload (payment proofs) |
| Helmet | 8 | Security headers |

Self-hosted on **Azure Ubuntu VPS** with **PM2** (process manager) and **Caddy** (reverse proxy + TLS).

### AI Service

Folder structure prepared under `ai-service/` for upcoming FastAPI service (intent classification, RAG-based chatbot). Contract defined in `docs/API-CONTRACT.md`. The AI service is called only by the backend — never directly by the frontend.

---

## Key Features

### Customer Booking
- Database-driven package & add-on pricing (no hardcoded values)
- Promo voucher validation at checkout
- Realtime calendar availability synced via Socket.IO
- Multi-step booking flow: package → date/time → event details → add-ons → payment
- Manual payment proof upload
- Native `@media print` printable invoices

### Admin Dashboard
- Realtime booking & payment notifications via Socket.IO
- Manual payment verification (confirm / reject with admin notes)
- Calendar management: mark dates as Tersedia, Penuh, or Libur
- Package, add-on, voucher, and terms & conditions management
- Manual booking creation (e.g. from WhatsApp inquiries)
- Printable admin invoices

### Email Notifications
- Booking confirmation email to customer on payment approval
- Rejection notification with admin notes on payment decline
- Admin notification on payment proof upload with:
  - `Reply-To` set to customer's email
  - Direct link to uploaded proof image
  - Direct link to admin dashboard booking detail

### Admin Auth & RBAC
- JWT authentication with 7-day token expiry
- Automatic 401 session handling — expired tokens clear storage and redirect to login with message
- Dynamic admin profile header (name, role, avatar initial from logged-in account)
- Role-based access: only `OWNER` can create or delete admin accounts
- Safety guards: cannot delete own account, cannot delete last remaining `OWNER`
- Three roles: `OWNER`, `ADMIN`, `CS`

---

## Local Development Setup

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** database (local, Neon, or any managed PostgreSQL)

### Installation

```bash
git clone <repository-url>
cd campose

# Install root + all sub-project dependencies
npm install
npm run setup
```

### Database Setup

```bash
# Push Prisma schema to database (creates/updates tables)
npm run db:push

# Seed default data (packages, add-ons, voucher, admin user, terms)
npm run db:seed
```

### Environment Variables

**`backend/.env`**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/campose"
DIRECT_URL="postgresql://user:password@localhost:5432/campose"

# Server
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Auth
JWT_SECRET=change-me-to-a-strong-random-string

# Email (Option A: custom SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Email (Option B: Gmail — omit SMTP_HOST to use Gmail service)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Email display
SMTP_FROM="Campose Photobooth <hello@campose.id>"

# Admin email notifications (comma-separated)
ADMIN_NOTIFICATION_EMAIL=admin@campose.id

# Public URLs used in email templates
API_PUBLIC_URL=http://localhost:4000
ADMIN_DASHBOARD_URL=http://localhost:5173/admin
```

**`frontend/.env`**

```env
VITE_API_URL=http://localhost:4000
```

### Running Locally

```bash
# Frontend + Backend concurrently
npm run dev

# Frontend only (http://localhost:5173)
npm run dev:web

# Backend only (http://localhost:4000)
npm run dev:api
```

### Default Admin Credentials

After `npm run db:seed`:

| Field | Value |
|---|---|
| Email | `admin@campose.id` |
| Password | `admin123` |

**Change immediately in production.**

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Run frontend + backend concurrently |
| `npm run dev:web` | Frontend only |
| `npm run dev:api` | Backend only |
| `npm run build` | Build both frontend and backend |
| `npm run setup` | Install dependencies for frontend + backend |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed default data |

### Backend-specific (`backend/`)

| Script | Description |
|---|---|
| `npm run dev` | Watch mode with tsx |
| `npm run build` | TypeScript compile (`tsc`) |
| `npm start` | Run compiled `dist/index.js` |
| `npm run typecheck` | Type check without emitting |
| `npm run db:studio` | Open Prisma Studio |

### Frontend-specific (`frontend/`)

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type check + Vite production build |
| `npm run preview` | Preview production build |

---

## Database Schema

Key tables managed by Prisma (see `backend/prisma/schema.prisma`):

| Table | Purpose |
|---|---|
| `Package` | Photobooth packages (2 Jam, 4 Jam, 8 Jam) |
| `Addon` | Add-on services (costumes, prints, extras) |
| `Booking` | Customer bookings (MENUNGGU_PEMBAYARAN → TERKONFIRMASI → SELESAI / DIBATALKAN) |
| `Payment` | Payment records (PENDING → MENUNGGU_KONFIRMASI → PAID / DITOLAK) |
| `Availability` | Calendar date overrides (TERSEDIA, PENUH, DIBOOKING, LIBUR) |
| `Voucher` | Discount codes |
| `Review` | Customer reviews |
| `AdminUser` | Admin accounts with roles (OWNER, ADMIN, CS) |
| `Setting` | Global settings (terms & conditions, etc.) |
| `ChatSession` / `ChatMessage` | Chatbot conversation logs |
| `PartnershipLead` | Partnership/franchise inquiry leads |

---

## Realtime Events (Socket.IO)

| Event | Trigger |
|---|---|
| `catalog:updated` | Package, add-on, or voucher modified |
| `availability:updated` | Calendar date status changed |
| `booking:created` | New booking submitted |
| `booking:updated` | Booking rescheduled or cancelled |
| `payment:confirmed` | Admin confirms payment |
| `payment:rejected` | Admin rejects payment |
| `payment:proof_uploaded` | Customer uploads payment proof |

---

## Deployment Overview

### Frontend (Vercel)

Automatically deployed on push to `main` branch. Vercel project is configured with the `VITE_API_URL` environment variable pointing to the production API.

### Backend (Azure VPS)

```bash
ssh your-vps
cd /path/to/campose/backend
git pull origin main
npm install
npm run build
pm2 restart all
```

Caddy handles HTTPS termination and reverse proxy to the Node.js process.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Frontend "Failed to load packages" | Verify backend is running and `VITE_API_URL` / `DATABASE_URL` are correct. Run `npm run db:seed`. |
| Calendar dates not saving | Check JWT token validity, backend logs for Prisma errors. |
| Emails not sending | Verify `SMTP_*` or `EMAIL_*` env vars. For Gmail, use an [App Password](https://myaccount.google.com/apppasswords). |
| Socket.IO not syncing | Verify `CORS_ORIGIN` includes frontend URL. Check browser WebSocket connection. |
| Admin dashboard empty after login | Token may be expired. 401 handling should auto-redirect to login. Clear browser storage and re-login. |

---

## References

- API Contract: [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md)
- Database Schema: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

---

## License

Campose &copy; 2026 Asah Program Team A26-CS263. All rights reserved.
