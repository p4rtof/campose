import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { routes } from './routes/index.js'
import { errorHandler, notFound } from './middlewares/errorHandler.js'

export const app = express()

app.use(helmet())
app.use(cors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',') }))
app.use(express.json({ limit: '100kb' }))

app.use('/api/v1', routes)
app.use(notFound)
app.use(errorHandler)
