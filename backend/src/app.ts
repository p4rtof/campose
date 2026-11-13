import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { routes } from './routes/index.js'
import { adminRoutes } from './routes/admin.routes.js'
import { errorHandler, notFound } from './middlewares/errorHandler.js'
import { verifyToken } from './lib/jwt.js'

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

export const app = express()
export const httpServer = createServer(app)

// Socket.IO untuk notifikasi real-time status booking & jadwal
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})

// Simpan io di app supaya bisa diakses dari route handler (req.app.get('io'))
app.set('io', io)

io.on('connection', (socket) => {
  // Admin join room 'admins' setelah login
  socket.on('admin:join', (token: string) => {
    try {
      verifyToken(token)
      socket.join('admins')
      socket.emit('admin:joined', { ok: true })
    } catch {
      socket.emit('admin:join_error', { message: 'Token tidak valid' })
    }
  })

  // Customer bergabung ke room booking tertentu (polling-free)
  socket.on('booking:watch', (code: string) => {
    if (typeof code === 'string' && code.trim()) {
      socket.join(`booking:${code.trim()}`)
    }
  })
})

// Konfigurasi Helmet tanpa script Midtrans (karena menggunakan verifikasi manual admin)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", ...corsOrigins, 'ws:', 'wss:', 'http:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
  })
)

// Konfigurasi CORS lengkap untuk mendukung Axios dari Frontend (Vite)
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Endpoint Health Check (memudahkan pengecekan saat di-deploy ke Render/Railway)
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Campose Backend API is running',
    timestamp: new Date().toISOString(),
  })
})

// Serve file upload (bukti bayar manual) secara statis
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Konvensi URL API sesuai Checklist Tech Stack (/api/v1/resource)
app.use('/api/v1', routes)
app.use('/api/v1/admin', adminRoutes)

// Penanganan endpoint tidak ditemukan (404) & Error Handler terpusat
app.use(notFound)
app.use(errorHandler)