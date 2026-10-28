import type { ErrorRequestHandler, RequestHandler } from 'express'
import { AppError } from '../lib/errors.js'

export const notFound: RequestHandler = (_req, _res, next) =>
  next(new AppError(404, 'NOT_FOUND', 'Endpoint tidak ditemukan'))

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message, details: err.details } })
  }
  console.error(err)
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan di server' } })
}
