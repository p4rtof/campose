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

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')

export const app = express()
export const httpServer = createServer(app)

// Socket.IO
export const io = new SocketIOServer(httpServer, {
  cors: { 
    origin: corsOrigins, 
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})

// Simpan io di app supaya bisa diakses dari route handler
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
    socket.join(`booking:${code}`)
  })
})

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://app.sandbox.midtrans.com", "https://snap-assets.sandbox.midtrans.com", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws://localhost:4000", "http://localhost:4000"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
}))
app.use(cors({ origin: corsOrigins }))
app.use(express.json({ limit: '10mb' }))

// Serve file upload (bukti bayar) secara statis
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/api/v1', routes)
app.use('/api/v1/admin', adminRoutes)
app.use(notFound)
app.use(errorHandler)
